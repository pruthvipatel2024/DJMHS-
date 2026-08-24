const express = require('express');
const router = express.Router();
const config = require('../config');
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendEmailViaProvider } = require('../services/providers/email.provider');
const crypto = require('crypto');

/**
 * GET /api/admin/system/otp-health
 * Protected ADMIN-Only Endpoint: Returns safe diagnostic information without leaking secrets.
 */
router.get('/system/otp-health', authenticate, authorize(['ADMIN']), async (req, res, next) => {
  try {
    const smtpUser = process.env.SMTP_USER || config.email.user;
    const smtpPass = process.env.SMTP_PASS || config.email.pass;
    const smtpHost = process.env.SMTP_HOST || config.email.host || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || config.email.port, 10) || 587;

    const isSmtpConfigured = !!(smtpUser && smtpPass);
    const dbConnected = await prisma.$queryRaw`SELECT 1 as alive`
      .then(() => 'connected')
      .catch(() => 'disconnected');

    res.status(200).json({
      success: true,
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected,
      emailProvider: {
        configured: isSmtpConfigured,
        smtpHost,
        smtpPort,
        smtpUserConfigured: !!smtpUser,
        smtpPasswordConfigured: !!smtpPass,
        fromAddress: process.env.SMTP_FROM || config.email.from || smtpUser || 'not-configured',
        mockMode: process.env.MOCK_COMMUNICATIONS_TO_LOG === 'true',
      },
      otpSettings: {
        expiryMinutes: config.otp?.expiryMinutes || 5,
        maxAttempts: config.otp?.maxAttempts || 3,
        resendCooldownSeconds: config.otp?.resendCooldownSeconds || 60,
        devMode: config.otp?.devMode || false,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/system/test-email
 * Protected ADMIN-Only Endpoint: Executes a live test email dispatch using production email provider.
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
        <h2 style="color: #1e3a8a;">DJMHS ERP — Live Admin System Test Email</h2>
        <p>This is a live system verification email dispatched at <strong>${new Date().toISOString()}</strong>.</p>
        <p>Request Correlation ID: <code>${reqId}</code></p>
        <p>Triggered by Admin User: <strong>${req.user.identifier}</strong></p>
      </div>
    `;

    const result = await sendEmailViaProvider({
      to: targetEmail,
      subject: 'DJMHS ERP — Live Admin System Verification Email',
      htmlContent: testHtml,
      reqId,
    });

    if (!result.success) {
      return res.status(502).json({
        success: false,
        code: 'OTP_DELIVERY_FAILED',
        message: 'SMTP server rejected test email dispatch.',
        error: result.error,
      });
    }

    // Audit Log Creation
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        actorName: req.user.identifier,
        action: 'ADMIN_TEST_EMAIL_DISPATCHED',
        entity: 'SYSTEM',
        diff: JSON.stringify({ recipient: targetEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'), messageId: result.messageId }),
        ipAddress: req.ip,
      },
    });

    res.status(200).json({
      success: true,
      message: 'SMTP accepted the test email for delivery.',
      recipient: targetEmail.replace(/^(.{2})(.*)(@.*)$/, '$1***$3'),
      messageId: result.messageId,
      correlationId: reqId,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
