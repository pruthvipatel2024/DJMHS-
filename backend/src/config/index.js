require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'sdjm-access-secret-fallback',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sdjm-refresh-secret-fallback',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '30m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    refreshRememberMeExpiration: process.env.JWT_REFRESH_REMEMBER_ME_EXPIRATION || '30d',
  },
  uploadDir: process.env.UPLOAD_DIR || '../uploads',
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'no-reply@sdjmt-highschool.edu.in',
    mock: process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true',
  },
  schoolName: 'Shree Dhaneshkumar Jasvantlal Maheta High School',
  establishedYear: '1959',
  location: 'Bhavnagar, Gujarat',
};

module.exports = config;
