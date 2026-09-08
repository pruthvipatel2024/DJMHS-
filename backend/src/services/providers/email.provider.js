const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const config = require('../../config');

let resendClient = null;
let smtpTransporter = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
  if (apiKey && !resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getSmtpTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const rawSmtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;

  if (!smtpUser || !rawSmtpPass) {
    return null;
  }

  // Sanitize Google App Password (remove any spaces)
  const smtpPass = rawSmtpPass.replace(/\s+/g, '');

  if (!smtpTransporter) {
    const isGmail = smtpHost.includes('gmail.com') || smtpUser.includes('@gmail.com');
    if (isGmail) {
      smtpTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    } else {
      smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        requireTLS: smtpPort === 587,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    }
  }
  return smtpTransporter;
};

/**
 * Dispatches an email via the configured provider mode.
 *
 * Supported EMAIL_PROVIDER modes:
 * - 'smtp'   (Gmail / Custom SMTP Gateway - App Password supported, no custom domain required)
 * - 'resend' (Resend HTTPS API)
 */
const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[Communication]';

  // 1. Audit & Validate Dynamic Recipient Address
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error(`${reqPrefix} Provider: EMAIL | FAILED: Dynamic recipient address is missing or invalid (${to}).`);
    return {
      success: false,
      code: 'INVALID_RECIPIENT_EMAIL',
      error: 'The recipient email address is invalid or missing.',
    };
  }

  const normalizedTo = to.trim().toLowerCase();
  const maskedTo = normalizedTo.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');
  const emailMode = (process.env.EMAIL_PROVIDER || config.email?.provider || 'smtp').toLowerCase();

  const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  const isResendConfigured = !!(process.env.RESEND_API_KEY && (process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail));

  // Helper to send via SMTP (Gmail / Custom)
  const sendViaSmtp = async () => {
    const transporter = getSmtpTransporter();
    const smtpUser = process.env.SMTP_USER;

    if (!transporter || !smtpUser) {
      console.error(`${reqPrefix} Provider: SMTP | FAILED: SMTP credentials not configured.`);
      return {
        success: false,
        code: 'SMTP_NOT_CONFIGURED',
        error: 'SMTP credentials are not configured in environment (SMTP_USER / SMTP_PASS).',
      };
    }

    try {
      console.log(`${reqPrefix} Provider: SMTP | Dispatching email to ${maskedTo} via Gmail SMTP (${smtpUser})...`);
      const info = await transporter.sendMail({
        from: `"Shree DJM High School" <${smtpUser}>`,
        to: normalizedTo,
        subject,
        html: htmlContent,
      });

      console.log(`${reqPrefix} Provider: SMTP | Recipient: ${maskedTo} | Status: DELIVERED (Message ID: ${info.messageId})`);
      return {
        success: true,
        channel: 'SMTP',
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`${reqPrefix} Provider: SMTP | Recipient: ${maskedTo} | Error:`, err.message);
      return {
        success: false,
        code: 'SMTP_DELIVERY_FAILED',
        error: err.message || 'SMTP gateway failed to deliver email.',
      };
    }
  };

  // Helper to send via Resend API
  const sendViaResend = async () => {
    const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
    const fromEmail = process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail;

    if (!apiKey || !fromEmail) {
      return {
        success: false,
        code: 'RESEND_NOT_CONFIGURED',
        error: 'RESEND_API_KEY or RESEND_FROM_EMAIL is missing in environment.',
      };
    }

    const resend = getResendClient();
    try {
      console.log(`${reqPrefix} Provider: RESEND_API | Dispatching email to ${maskedTo} via Resend (${fromEmail})...`);
      const response = await resend.emails.send({
        from: fromEmail,
        to: [normalizedTo],
        subject: subject,
        html: htmlContent,
      });

      if (response.error) {
        console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Resend Rejected:`, response.error);
        return {
          success: false,
          code: response.error.name || 'RESEND_REJECTED',
          error: response.error.message || 'Resend rejected email dispatch.',
        };
      }

      const messageId = response.data?.id || 'resend_submitted';
      console.log(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Status: ACCEPTED (Message ID: ${messageId})`);
      return {
        success: true,
        channel: 'RESEND_API',
        messageId,
      };
    } catch (err) {
      console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Exception: ${err.message}`);
      return {
        success: false,
        code: 'NETWORK_ERROR',
        error: err.message || 'Network exception while connecting to Resend HTTPS API.',
      };
    }
  };

  // Dispatch Strategy:
  // If EMAIL_PROVIDER is 'smtp' or if SMTP is configured and mode is not explicitly 'resend', use SMTP first
  if (emailMode === 'smtp' || (isSmtpConfigured && emailMode !== 'resend')) {
    const smtpResult = await sendViaSmtp();
    if (smtpResult.success) return smtpResult;

    // Resend fallback
    if (isResendConfigured) {
      console.warn(`${reqPrefix} Provider: SMTP dispatch failed (${smtpResult.error}). Attempting fallback to Resend API...`);
      const resendResult = await sendViaResend();
      if (resendResult.success) return resendResult;
    }
    return smtpResult;
  } else {
    // Mode is explicitly 'resend'
    const resendResult = await sendViaResend();
    if (resendResult.success) return resendResult;

    // Gmail SMTP fallback if Resend fails (e.g. unverified domain 403 error)
    if (isSmtpConfigured) {
      console.warn(`${reqPrefix} Provider: Resend rejected (${resendResult.error}). Automatically falling back to Gmail SMTP (${process.env.SMTP_USER})...`);
      const smtpResult = await sendViaSmtp();
      if (smtpResult.success) return smtpResult;
    }
    return resendResult;
  }
};

module.exports = {
  sendEmailViaProvider,
};
