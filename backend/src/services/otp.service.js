const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail, sendSMS } = require('./communication.service');
const { getStudentOtpTemplate } = require('./emailTemplate.service');

// Memory store for OTP records: grNumber -> { otpHash, expiresAt, attempts, lastSentAt }
const otpStore = new Map();

/**
 * Generate cryptographically secure 6-digit OTP
 */
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Request and dispatch OTP to registered parent contact
 */
const requestStudentOtp = async (grNumber, parentContact = {}) => {
  const now = Date.now();
  const existing = otpStore.get(grNumber);

  // 60-second resend cooldown check
  if (existing && now - existing.lastSentAt < 60 * 1000) {
    const secondsRemaining = Math.ceil((60 * 1000 - (now - existing.lastSentAt)) / 1000);
    throw new Error(`Please wait ${secondsRemaining} seconds before requesting a new OTP.`);
  }

  const plainOtp = generate6DigitOtp();
  const otpHash = await bcrypt.hash(plainOtp, 10);
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(grNumber, {
    otpHash,
    expiresAt,
    attempts: 0,
    lastSentAt: now,
  });

  // Non-blocking dispatch of OTP to parent email/phone if provided
  const { phone, email, studentName } = parentContact;
  const message = `DJMHS High School Portal OTP: ${plainOtp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

  if (phone) {
    sendSMS(phone, message).catch((e) => console.error('SMS dispatch note:', e.message));
  }
  if (email) {
    const htmlBody = getStudentOtpTemplate({ studentName, grNumber, otp: plainOtp });
    sendEmail(email, 'DJMHS Student Portal Login Verification OTP', htmlBody).catch((e) => console.error('Email dispatch note:', e.message));
  }

  return true;
};

/**
 * Verify OTP for GR Number
 */
const verifyStudentOtp = async (grNumber, submittedOtp) => {
  const record = otpStore.get(grNumber);

  if (!record) {
    throw new Error('No active OTP request found. Please request a new OTP.');
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(grNumber);
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  if (record.attempts >= 3) {
    otpStore.delete(grNumber);
    throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
  }

  record.attempts += 1;
  otpStore.set(grNumber, record);

  const isValid = await bcrypt.compare(submittedOtp, record.otpHash);
  if (!isValid) {
    const remaining = 3 - record.attempts;
    throw new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  // Invalidate OTP after successful use
  otpStore.delete(grNumber);
  return true;
};

module.exports = {
  requestStudentOtp,
  verifyStudentOtp,
};
