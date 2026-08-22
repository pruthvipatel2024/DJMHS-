const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
if (!config.email.mock && config.email.user) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

const sendSMS = async (to, message) => {
  if (config.email.mock || !transporter) {
    console.log(`[📱 MOCK SMS TO ${to}]: ${message}`);
    return { success: true, channel: 'SMS_MOCK' };
  }
  // In live environments, trigger Gateway API provider here
  return { success: true, channel: 'SMS_LIVE' };
};

const sendEmail = async (to, subject, htmlContent) => {
  if (config.email.mock || !transporter) {
    console.log(`[📧 MOCK EMAIL TO ${to}] | SUBJECT: ${subject}\n--- CONTENT ---\n${htmlContent.replace(/<[^>]*>?/gm, '')}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  try {
    await transporter.sendMail({
      from: `"${config.schoolName}" <${config.email.from}>`,
      to,
      subject,
      html: htmlContent,
    });
    return { success: true, channel: 'EMAIL_SMTP' };
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

  if (user.phone) {
    await sendSMS(user.phone, message);
  }
  if (user.email) {
    await sendEmail(user.email, 'DJMHS ERP - Password Reset OTP', html);
  }
  return true;
};

module.exports = {
  sendSMS,
  sendEmail,
  sendOTP,
};
