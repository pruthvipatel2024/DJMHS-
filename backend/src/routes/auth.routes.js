const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, validateBody } = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Public Authentication & Recovery Endpoints
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/student/request-otp', authLimiter, authController.requestStudentOtpController);
router.post('/student/verify-otp', authLimiter, authController.verifyStudentOtpController);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);
router.post('/test-email', authController.testEmailController);

// Protected Identity Endpoints
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAllDevices);
router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

// Enforced First-Time Password Change & General Change Password
router.post('/first-time-change-password', authenticate, validateBody(changePasswordSchema), authController.firstTimeChangePassword);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.firstTimeChangePassword);

module.exports = router;
