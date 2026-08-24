const nodemailer = require('nodemailer');
const config = require('../../config');

let transporter = null;

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || config.email.user;
  const smtpPass = process.env.SMTP_PASS || config.email.pass;
  const smtpHost = process.env.SMTP_HOST || config.email.host || 'smtp.gmail.com';
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
  const activeTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER || config.email.user;
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';
  const maskedTo = to ? to.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : 'none';

  if (process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true' || !activeTransporter) {
    console.log(`${reqPrefix} [📧 MOCK EMAIL PROVIDER TO ${maskedTo}] | SUBJECT: ${subject}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || config.email.from || smtpUser;
    const info = await activeTransporter.sendMail({
      from: `"${config.schoolName}" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent,
    });

    if (!info.accepted || !info.accepted.includes(to)) {
      console.error(`${reqPrefix} Provider: EMAIL | Recipient ${maskedTo} REJECTED by SMTP server. Rejected list:`, info.rejected);
      return {
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        error: `Recipient ${maskedTo} was rejected by SMTP server.`,
      };
    }

    console.log(`${reqPrefix} Provider: EMAIL | Recipient: ${maskedTo} | Response: ACCEPTED FOR DELIVERY (MessageId: ${info.messageId})`);
    return { success: true, channel: 'EMAIL_SMTP', messageId: info.messageId };
  } catch (err) {
    console.error(`${reqPrefix} Provider: EMAIL | Recipient: ${maskedTo} | Response: FAILED (${err.message})`);
    return { success: false, code: 'OTP_DELIVERY_FAILED', error: err.message };
  }
};

module.exports = {
  sendEmailViaProvider,
};
