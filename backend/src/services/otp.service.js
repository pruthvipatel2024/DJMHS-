const crypto = require('crypto');
const bcrypt = require('bcrypt');
const config = require('../config');
const prisma = require('../config/db');
const { sendEmailViaProvider } = require('./providers/email.provider');
const { sendSMSViaProvider } = require('./providers/sms.provider');
const { getStudentOtpTemplate } = require('./emailTemplate.service');

/**
 * Generate cryptographically secure 6-digit OTP
 */
const generate6DigitOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Request and dispatch OTP to registered parent/student contact with Database Persistence
 */
const requestStudentOtp = async (grNumber, parentContact = {}, reqId = '') => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';
  const now = new Date();
  const cooldownSeconds = config.otp?.resendCooldownSeconds || 60;
  const cooldownMs = cooldownSeconds * 1000;

  // 1. Resend Cooldown Check from PostgreSQL Database
  const existing = await prisma.studentOtp.findUnique({
    where: { grNumber },
  });

  if (existing && existing.lastSentAt && (now.getTime() - new Date(existing.lastSentAt).getTime() < cooldownMs)) {
    const secondsRemaining = Math.ceil((cooldownMs - (now.getTime() - new Date(existing.lastSentAt).getTime())) / 1000);
    console.log(`${reqPrefix} Cooldown active for GR ${grNumber}: ${secondsRemaining}s remaining`);
    const err = new Error(`Please wait ${secondsRemaining} seconds before requesting a new OTP.`);
    err.code = 'RATE_LIMIT_COOLDOWN';
    err.secondsRemaining = secondsRemaining;
    throw err;
  }

  const plainOtp = generate6DigitOtp();
  const otpHash = await bcrypt.hash(plainOtp, 10);
  const expiryMinutes = config.otp?.expiryMinutes || 5;
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  // Diagnostic logging (dev mode only)
  if (config.otp?.devMode || (process.env.OTP_DEVELOPMENT_MODE === 'true' && process.env.NODE_ENV !== 'production')) {
    console.log(`${reqPrefix} [DEV ONLY] OTP generated for ${grNumber.replace(/^(.{6})(.*)$/, '$1***')}: ${plainOtp}`);
  }

  const { phone, email, studentName } = parentContact;
  const maskedEmail = email ? email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : 'none';
  console.log(`${reqPrefix} Contact resolved: ${maskedEmail}`);

  let deliverySuccess = false;
  let deliveryChannel = 'EMAIL';

  // 2. Dispatch OTP via Email Provider
  if (email) {
    const htmlBody = getStudentOtpTemplate({ studentName, grNumber, otp: plainOtp });
    const emailResult = await sendEmailViaProvider({
      to: email,
      subject: 'DJMHS Student Portal Login Verification OTP',
      htmlContent: htmlBody,
      reqId,
    });

    if (emailResult.success) {
      deliverySuccess = true;
      deliveryChannel = emailResult.channel;
    } else {
      console.error(`${reqPrefix} Email delivery failed for ${grNumber}:`, emailResult.error);
    }
  }

  // 3. Dispatch via SMS if configured
  if (phone) {
    const message = `DJMHS High School Portal OTP: ${plainOtp}. Valid for 5 minutes. Do not share this OTP.`;
    const smsResult = await sendSMSViaProvider({ to: phone, message });
    if (smsResult.success) deliverySuccess = true;
  }

  // 4. Verify Provider Acceptance
  if (!deliverySuccess && !config.email.mock && process.env.MOCK_COMMUNICATIONS_TO_LOG !== 'true') {
    const err = new Error('Unable to deliver OTP. Please try again later.');
    err.code = 'OTP_DELIVERY_FAILED';
    throw err;
  }

  // 5. Persistent Upsert in PostgreSQL StudentOtp Table
  await prisma.studentOtp.upsert({
    where: { grNumber },
    update: {
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      consumedAt: null,
    },
    create: {
      grNumber,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
    },
  });

  console.log(`${reqPrefix} Database-backed OTP record created in PostgreSQL for GR ${grNumber} | Expires: ${expiresAt.toISOString()}`);

  return {
    success: true,
    expiresIn: expiryMinutes * 60,
  };
};

/**
 * Verify OTP from PostgreSQL with Single-Use Consumption & Attempt Lockout
 */
const verifyStudentOtp = async (grNumber, submittedOtp, reqId = '') => {
  const reqPrefix = reqId ? `[${reqId}]` : '[OTP]';
  const now = new Date();
  const maxAttempts = config.otp?.maxAttempts || 3;

  const record = await prisma.studentOtp.findUnique({
    where: { grNumber },
  });

  if (!record || record.consumedAt) {
    console.log(`${reqPrefix} No active/unconsumed OTP found for GR ${grNumber}`);
    const err = new Error('No active OTP request found. Please request a new OTP.');
    err.code = 'NO_ACTIVE_OTP';
    throw err;
  }

  // 1. Expiry Check
  if (now > new Date(record.expiresAt)) {
    console.log(`${reqPrefix} OTP expired for GR ${grNumber}`);
    const err = new Error('This OTP has expired. Please request a new OTP.');
    err.code = 'EXPIRED_OTP';
    throw err;
  }

  // 2. Attempt Limit Check
  if (record.attempts >= maxAttempts) {
    console.log(`${reqPrefix} Max attempts (${maxAttempts}) exceeded for GR ${grNumber}`);
    const err = new Error('Too many verification attempts. Please request a new OTP.');
    err.code = 'MAX_ATTEMPTS_EXCEEDED';
    throw err;
  }

  const newAttempts = record.attempts + 1;
  await prisma.studentOtp.update({
    where: { id: record.id },
    data: { attempts: newAttempts },
  });

  // 3. Compare Bcrypt Hash
  const isValid = await bcrypt.compare(submittedOtp, record.otpHash);
  if (!isValid) {
    const remaining = maxAttempts - newAttempts;
    console.log(`${reqPrefix} Invalid OTP submitted for GR ${grNumber}. Remaining attempts: ${remaining}`);
    if (remaining <= 0) {
      const err = new Error('Too many verification attempts. Please request a new OTP.');
      err.code = 'MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }
    const err = new Error(`Incorrect OTP. ${remaining} attempt(s) remaining.`);
    err.code = 'INVALID_OTP';
    err.remainingAttempts = remaining;
    throw err;
  }

  // 4. Mark Consumed in Database
  await prisma.studentOtp.update({
    where: { id: record.id },
    data: { consumedAt: now },
  });

  console.log(`${reqPrefix} OTP verification SUCCESS for GR ${grNumber}. Marked consumed at ${now.toISOString()}`);
  return true;
};

module.exports = {
  requestStudentOtp,
  verifyStudentOtp,
};
