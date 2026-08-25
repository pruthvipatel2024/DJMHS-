const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const config = require('../../config');

let transporter = null;
let resendClient = null;

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY || config.email.resendApiKey;
  if (apiKey && !resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
};

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || config.email.user;
  const smtpPass = process.env.SMTP_PASS || config.email.pass;
  const smtpHost = process.env.SMTP_HOST || config.email.host || 'smtp.resend.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || config.email.port, 10) || 587;

  if (config.email.mock || process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true') {
    return null;
  }

  if (!transporter && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
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
  return transporter;
};

const sendEmailViaProvider = async ({ to, subject, htmlContent, reqId = '' }) => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';
  const maskedTo = to ? to.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : 'none';

  if (process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true') {
    console.log(`${reqPrefix} [📧 MOCK EMAIL PROVIDER TO ${maskedTo}] | SUBJECT: ${subject}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  const resend = getResendClient();
  const fromAddress = process.env.SMTP_FROM || config.email.from || 'Shree DJM High School <onboarding@resend.dev>';

  // 1. Primary Priority: Dispatch via Official Resend SDK API
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: fromAddress,
        to: [to],
        subject: subject,
        html: htmlContent,
      });

      if (response.error) {
        console.error(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Error:`, response.error);
        return {
          success: false,
          code: 'OTP_DELIVERY_FAILED',
          error: response.error.message || 'Resend API rejected email dispatch.',
        };
      }

      const resendId = response.data?.id || 'resend_ok';
      console.log(`${reqPrefix} Provider: RESEND_API | Recipient: ${maskedTo} | Response: ACCEPTED FOR DELIVERY (Resend ID: ${resendId})`);
      return { success: true, channel: 'RESEND_API', messageId: resendId };
    } catch (err) {
      console.error(`${reqPrefix} Provider: RESEND_API | Exception: ${err.message}`);
      // Fallthrough to SMTP fallback if Resend API encounters network glitch
    }
  }

  // 2. Secondary Priority: Fallback to SMTP Transporter
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    console.log(`${reqPrefix} [📧 MOCK EMAIL PROVIDER TO ${maskedTo}] | SUBJECT: ${subject}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: fromAddress.includes('<') ? fromAddress : `"${config.schoolName}" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent,
    });

    if (!info.accepted || !info.accepted.includes(to)) {
      console.error(`${reqPrefix} Provider: EMAIL_SMTP | Recipient ${maskedTo} REJECTED by SMTP server. Rejected list:`, info.rejected);
      return {
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        error: `Recipient ${maskedTo} was rejected by SMTP server.`,
      };
    }

    console.log(`${reqPrefix} Provider: EMAIL_SMTP | Recipient: ${maskedTo} | Response: ACCEPTED FOR DELIVERY (MessageId: ${info.messageId})`);
    return { success: true, channel: 'EMAIL_SMTP', messageId: info.messageId };
  } catch (err) {
    console.error(`${reqPrefix} Provider: EMAIL_SMTP | Recipient: ${maskedTo} | Response: FAILED (${err.message})`);
    return { success: false, code: 'OTP_DELIVERY_FAILED', error: err.message };
  }
};

module.exports = {
  sendEmailViaProvider,
};
