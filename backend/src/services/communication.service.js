const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (config.email.mock) {
    return null;
  }
  if (!transporter && config.email.user && config.email.pass) {
    const port = parseInt(config.email.port, 10) || 465;
    const isSecure = port === 465;
    transporter = nodemailer.createTransport({
      host: config.email.host || 'smtp.gmail.com',
      port: port,
      secure: isSecure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return transporter;
};

const sendSMS = async (to, message) => {
  const activeTransporter = getTransporter();
  if (config.email.mock || !activeTransporter) {
    console.log(`[📱 MOCK SMS TO ${to}]: ${message}`);
    return { success: true, channel: 'SMS_MOCK' };
  }
  // In live environments, trigger Gateway API provider here
  console.log(`[📱 LIVE SMS TO ${to}]: ${message}`);
  return { success: true, channel: 'SMS_LIVE' };
};

const sendEmail = async (to, subject, htmlContent) => {
  const activeTransporter = getTransporter();
  if (config.email.mock || !activeTransporter) {
    console.log(`[📧 MOCK EMAIL TO ${to}] | SUBJECT: ${subject}\n--- CONTENT ---\n${htmlContent.replace(/<[^>]*>?/gm, '')}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  try {
    const fromAddress = config.email.from || config.email.user;
    const info = await activeTransporter.sendMail({
      from: `"${config.schoolName}" <${fromAddress}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[📧 LIVE EMAIL SENT TO ${to}] Message ID: ${info.messageId}`);
    return { success: true, channel: 'EMAIL_SMTP', messageId: info.messageId };
  } catch (err) {
    console.error(`Error sending email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

const sendOTP = async (user, otp) => {
  const message = `Your Shree Dhaneshkumar Jasvantlal Maheta High School password reset OTP is ${otp}. Valid for 15 minutes. Do not share this code with anyone.`;
  const html = `<div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px;">
    <h2 style="color: #1D4ED8; margin-top: 0;">DJMHS High School ERP — Security OTP</h2>
    <p>We received a password reset request for your account (<strong>${user.identifier}</strong>).</p>
    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #b45309; margin: 20px 0;">
      ${otp}
    </div>
    <p style="font-size: 14px; color: #64748b;">This verification code will expire in 15 minutes. If you did not initiate this request, please change your password immediately or alert the school office.</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <p style="font-size: 12px; color: #94a3b8;">Est. 1959 — Shree Dhaneshkumar Jasvantlal Maheta High School, Bhavnagar, Gujarat.</p>
  </div>`;

  let targetEmail = user.email;
  let targetPhone = user.phone;

  if (!targetEmail && user.studentProfile?.parents?.length) {
    const parentObj = user.studentProfile.parents[0]?.parent;
    if (parentObj?.email) targetEmail = parentObj.email;
    if (parentObj?.user?.email) targetEmail = parentObj.user.email;
    if (!targetPhone && parentObj?.phone) targetPhone = parentObj.phone;
  }
  if (!targetEmail && user.staffProfile?.email) {
    targetEmail = user.staffProfile.email;
  }

  if (targetPhone) {
    sendSMS(targetPhone, message).catch(() => {});
  }
  if (targetEmail) {
    sendEmail(targetEmail, 'DJMHS ERP - Password Reset OTP', html).catch(() => {});
  }
  return true;
};

module.exports = {
  sendSMS,
  sendEmail,
  sendOTP,
};
