const nodemailer = require('nodemailer');
const { Resend } = require('resend');
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
  const smtpUser = process.env.SMTP_USER || 'rtobvn8191@gmail.com';
  const smtpPass = process.env.SMTP_PASS || 'akrphoqajxdsjqer';
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
 * Dispatches an email dynamically from registered student parent contact in PostgreSQL.
 * Supports both Gmail SMTP App Password Mode (No custom domain required) and Resend API Mode.
 */
const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';

  // 1. Audit Recipient Address
  if (!to || !to.includes('@')) {
    console.error(`${reqPrefix} Provider: EMAIL | FAILED: Dynamic recipient address is missing or invalid (${to}).`);
    return {
      success: false,
      code: 'NO_REGISTERED_CONTACT',
      error: 'No valid recipient email address found for student parent contact.',
    };
  }

  const maskedTo = to.replace(/^(.{2})(.*)(@.*)$/, '$1***$3');
  const providerMode = process.env.EMAIL_PROVIDER || config.email?.provider || 'smtp';

  // 2. Mode A: Gmail SMTP Mode (Delivers to ANY student email without requiring a custom domain)
  if (providerMode === 'smtp' || (!process.env.RESEND_API_KEY && process.env.SMTP_USER)) {
    const transporter = getSmtpTransporter();
    const smtpUser = process.env.SMTP_USER || 'rtobvn8191@gmail.com';

    if (!transporter) {
      console.error(`${reqPrefix} Provider: GMAIL_SMTP | FAILED: SMTP credentials (SMTP_USER / SMTP_PASS) not configured.`);
      return {
        success: false,
        code: 'SMTP_NOT_CONFIGURED',
        error: 'Gmail SMTP credentials are not configured on server.',
      };
    }

    try {
      const info = await transporter.sendMail({
        from: `"Shree DJM High School" <${smtpUser}>`,
        to,
        subject,
        html: htmlContent,
      });

      if (!info.accepted || !info.accepted.includes(to)) {
        console.error(`${reqPrefix} Provider: GMAIL_SMTP | Recipient ${maskedTo} REJECTED by SMTP server.`);
        return {
          success: false,
          code: 'OTP_DELIVERY_FAILED',
          error: `Recipient ${maskedTo} was rejected by SMTP server.`,
        };
      }

      console.log(`${reqPrefix} Provider: GMAIL_SMTP | Recipient: ${maskedTo} | Status: ACCEPTED FOR DELIVERY (Message ID: ${info.messageId})`);
      return {
        success: true,
        channel: 'GMAIL_SMTP',
        messageId: info.messageId,
      };
    } catch (err) {
      console.error(`${reqPrefix} Provider: GMAIL_SMTP | Recipient: ${maskedTo} | Error: ${err.message}`);
      return {
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        error: err.message || 'Gmail SMTP failed to deliver OTP email.',
      };
    }
  }

  // 3. Mode B: Resend HTTPS API Mode (Requires verified domain in Resend Dashboard)
  const apiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
  if (!apiKey) {
    console.error(`${reqPrefix} Provider: RESEND_API | FAILED: RESEND_API_KEY is not configured in backend environment.`);
    return {
      success: false,
      code: 'RESEND_NOT_CONFIGURED',
      error: 'RESEND_API_KEY is not configured in server environment.',
    };
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail || 'Shree DJM High School <onboarding@resend.dev>';
  const resend = getResendClient();

  try {
    const response = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: htmlContent,
    });

    if (response.error) {
      console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Error:`, response.error);

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
        error: response.error.message || 'Resend API rejected email dispatch.',
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
    console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Network Exception: ${err.message}`);
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: err.message || 'Network exception while connecting to Resend HTTPS API.',
    };
  }
};

module.exports = {
  sendEmailViaProvider,
};
