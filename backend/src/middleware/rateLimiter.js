const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests generated from this IP address, please try again after 15 minutes.',
  },
});

// Strict Login Rate Limiter (Brute force prevention per Chapter 1.8)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 15, // Max 15 login requests per IP before transport level throttling
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Multiple authentication attempts detected. Please wait 15 minutes before retrying.',
  },
});

module.exports = { apiLimiter, authLimiter };
