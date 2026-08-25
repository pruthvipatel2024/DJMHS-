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
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;

  if (!smtpTransporter && smtpUser && smtpPass) {
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
  return smtpTransporter;
};

/**
 * Dispatches an email via the configured provider mode.
 * The `to` address MUST originate dynamically from PostgreSQL parent contact resolution.
 * The `from` address MUST come exclusively from environment configuration.
 *
 * Supported EMAIL_PROVIDER modes:
 * - 'resend' (Resend HTTPS API - Production Provider)
 * - 'smtp'   (Gmail / Custom SMTP Gateway)
 */
const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';

  // 1. Audit & Validate Dynamic Recipient Address
  if (!to || typeof to !== 'string' || !to.includes('@')) {
    console.error(`${reqPrefix} Provider: EMAIL | FAILED: Dynamic recipient address is missing or invalid (${to}).`);
    return {
      success: false,
      code: 'INVALID_PARENT_EMAIL',
      error: 'The registered parent email address is invalid or missing.',
    };
  }

  const normalizedTo = to.trim().toLowerCase();
  const maskedTo = normalizedTo.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');
  const emailMode = process.env.EMAIL_PROVIDER || config.email?.provider || 'resend';

  // 2. Mode A: Resend HTTPS API Mode (Primary Production Transport)
  if (emailMode === 'resend' || process.env.RESEND_API_KEY) {
    const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
    if (!apiKey) {
      console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_API_KEY environment variable is missing.`);
      return {
        success: false,
        code: 'RESEND_NOT_CONFIGURED',
        error: 'RESEND_API_KEY is not configured in server environment.',
      };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail;
    if (!fromEmail) {
      console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_FROM_EMAIL environment variable is missing.`);
      return {
        success: false,
        code: 'INVALID_SENDER',
        error: 'RESEND_FROM_EMAIL is not configured on server.',
      };
    }

    const resend = getResendClient();

    try {
      console.log(`${reqPrefix} Provider: RESEND_API | Initiating dispatch to dynamic parent contact: ${maskedTo}`);
      const response = await resend.emails.send({
        from: fromEmail,
        to: [normalizedTo],
        subject: subject,
        html: htmlContent,
      });

      if (response.error) {
        console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Resend API Rejected:`, response.error);

        let classifiedCode = 'OTP_DELIVERY_FAILED';
        if (response.error.name === 'validation_error') {
          classifiedCode = 'INVALID_RECIPIENT';
        } else if (response.error.name === 'rate_limit_exceeded') {
          classifiedCode = 'RESEND_RATE_LIMITED';
        } else if (response.error.statusCode === 401 || response.error.statusCode === 403) {
          classifiedCode = 'RESEND_AUTH_FAILED';
        }

        return {
          success: false,
          code: classifiedCode,
          error: response.error.message || 'Resend HTTPS API rejected email dispatch.',
        };
      }

      const messageId = response.data?.id || 'resend_submitted';
      console.log(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Status: ACCEPTED BY RESEND (Message ID: ${messageId})`);

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
  }

  // 3. Mode B: SMTP Mode
  const transporter = getSmtpTransporter();
  const smtpUser = process.env.SMTP_USER;

  if (!transporter || !smtpUser) {
    console.error(`${reqPrefix} Provider: SMTP | FAILED: SMTP credentials not configured.`);
    return {
      success: false,
      code: 'SMTP_NOT_CONFIGURED',
      error: 'SMTP credentials are not configured on server.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Shree DJM High School" <${smtpUser}>`,
      to: normalizedTo,
      subject,
      html: htmlContent,
    });

    if (!info.accepted || !info.accepted.includes(normalizedTo)) {
      console.error(`${reqPrefix} Provider: SMTP | Recipient ${maskedTo} REJECTED by SMTP server.`);
      return {
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        error: `Recipient ${maskedTo} was rejected by SMTP server.`,
      };
    }

    console.log(`${reqPrefix} Provider: SMTP | Recipient: ${maskedTo} | Status: ACCEPTED FOR DELIVERY (Message ID: ${info.messageId})`);
    return {
      success: true,
      channel: 'SMTP',
      messageId: info.messageId,
    };
  } catch (err) {
    console.error(`${reqPrefix} Provider: SMTP | Recipient: ${maskedTo} | Error: ${err.message}`);
    return {
      success: false,
      code: 'OTP_DELIVERY_FAILED',
      error: err.message || 'SMTP gateway failed to deliver email.',
    };
  }
};

module.exports = {
  sendEmailViaProvider,
};
