const express = require('express');
const router = express.Router();
const config = require('../config');
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendEmailViaProvider } = require('../services/providers/email.provider');
const crypto = require('crypto');

/**
 * GET /api/admin/system/otp-health
 * Protected ADMIN-Only Endpoint: Safe diagnostic payload without exposing secrets.
 */
router.get('/system/otp-health', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const resendApiKey = process.env.RESEND_API_KEY || config.email?.resendApiKey;
    const isResendConfigured = !!resendApiKey;
    const fromEmail = process.env.RESEND_FROM_EMAIL || config.email?.resendFromEmail || '';
    
    const dbConnected = await prisma.$queryRaw`SELECT 1 as alive`
      .then(() => 'connected')
      .catch(() => 'disconnected');

    res.status(200).json({
      success: true,
      otpProvider: 'resend',
      resendConfigured: isResendConfigured,
      senderConfigured: !!fromEmail,
      fromAddress: fromEmail,
      database: dbConnected,
      environment: process.env.NODE_ENV || 'development',
      otpSettings: {
        expiryMinutes: config.otp?.expiryMinutes || 5,
        maxAttempts: config.otp?.maxAttempts || 3,
        resendCooldownSeconds: config.otp?.resendCooldownSeconds || 60,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/system/test-email
 * Protected ADMIN-Only Endpoint: Executes a live test email dispatch via Resend HTTPS API.
 */
router.post('/system/test-email', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const { email } = req.body;
    const targetEmail = email || req.user.email || req.user.identifier;
    const reqId = `ADMIN-TEST-${crypto.randomUUID().slice(0, 8)}`;

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid Target Email', message: 'A valid email address is required for testing.' });
    }

    const testHtml = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e3a8a;">DJMHS ERP — Email Delivery Test</h2>
        <p>This is a live system verification email dispatched via <strong>Resend HTTPS API</strong> at <strong>${new Date().toISOString()}</strong>.</p>
        <p>Request Correlation ID: <code>${reqId}</code></p>
        <p>Triggered by Admin User: <strong>${req.user.identifier}</strong></p>
      </div>
    `;

    const result = await sendEmailViaProvider({
      to: targetEmail,
      subject: 'DJMHS ERP — Email Delivery Test',
      htmlContent: testHtml,
      reqId,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        code: result.code || 'OTP_DELIVERY_FAILED',
        message: 'Resend API rejected test email dispatch.',
        error: result.error,
      });
    }

    // Safe audit logging
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.identifier,
        action: 'ADMIN_TEST_EMAIL_DISPATCHED',
        entity: 'SYSTEM',
        diff: JSON.stringify({ recipient: targetEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'), messageId: result.messageId, provider: 'resend' }),
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      provider: 'resend',
      messageId: result.messageId,
      recipient: targetEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'),
      correlationId: reqId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
