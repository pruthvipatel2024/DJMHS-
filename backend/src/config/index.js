require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '30m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    refreshRememberMeExpiration: process.env.JWT_REFRESH_REMEMBER_ME_EXPIRATION || '30d',
  },
  uploadDir: process.env.UPLOAD_DIR || '../uploads',
  email: {
    provider: 'resend',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || '',
    mock: process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true',
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 3,
    resendCooldownSeconds: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60,
    devMode: process.env.OTP_DEVELOPMENT_MODE === 'true' && process.env.NODE_ENV !== 'production',
  },
  schoolName: 'Shree Dhaneshkumar Jasvantlal Maheta High School',
  establishedYear: '1959',
  location: 'Bhavnagar, Gujarat',
};

module.exports = config;
