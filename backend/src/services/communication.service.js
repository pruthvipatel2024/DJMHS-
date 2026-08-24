const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER || config.email.user || 'rtobvn8191@gmail.com';
  const smtpPass = process.env.SMTP_PASS || config.email.pass || 'akrphoqajxdsjqer';
  const smtpHost = process.env.SMTP_HOST || config.email.host || 'smtp.gmail.com';

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false, // STARTTLS for port 587
      requireTLS: true,
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

const sendSMS = async (to, message) => {
  if (process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true') {
    console.log(`[📱 MOCK SMS TO ${to}]: ${message}`);
    return { success: true, channel: 'SMS_MOCK' };
  }
  // In live environments, trigger Gateway API provider here
  console.log(`[📱 LIVE SMS TO ${to}]: ${message}`);
  return { success: true, channel: 'SMS_LIVE' };
};

const sendEmail = async (to, subject, htmlContent) => {
  const activeTransporter = getTransporter();
  const smtpUser = process.env.SMTP_USER || config.email.user || 'rtobvn8191@gmail.com';

  if (process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true') {
    console.log(`[📧 MOCK EMAIL TO ${to}] | SUBJECT: ${subject}`);
    return { success: true, channel: 'EMAIL_MOCK' };
  }

  try {
    const info = await activeTransporter.sendMail({
      from: `"${config.schoolName}" <${smtpUser}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`[📧 LIVE EMAIL DISPATCH SUCCESS] Sent to ${to} | Message ID: ${info.messageId}`);
    return { success: true, channel: 'EMAIL_SMTP', messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [LIVE EMAIL DISPATCH FAILED] Error sending to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

const sendOTP = async (user, otp) => {
  const { getStudentOtpTemplate } = require('./emailTemplate.service');
  const message = `Your Shree Dhaneshkumar Jasvantlal Maheta High School password reset OTP is ${otp}. Valid for 15 minutes. Do not share this code with anyone.`;
  
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

  const html = getStudentOtpTemplate({
    studentName: user.identifier,
    grNumber: user.identifier,
    otp: otp,
  });

  if (targetPhone) {
    sendSMS(targetPhone, message).catch(() => {});
  }
  if (targetEmail) {
    sendEmail(targetEmail, 'DJMHS ERP — Security Verification OTP', html).catch(() => {});
  }
  return true;
};

module.exports = {
  sendSMS,
  sendEmail,
  sendOTP,
};
