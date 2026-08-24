const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

const getTransporter = () => {
  if (config.email.mock) {
    return null;
  }
  if (!transporter && config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host || 'smtp.gmail.com',
      port: parseInt(config.email.port, 10) || 587,
      secure: false, // Must be false for 587 STARTTLS
      requireTLS: true,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
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
