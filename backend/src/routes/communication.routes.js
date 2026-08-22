const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Stub router - upgraded in Phase 13 (Complaints, Inquiries CRM & Announcements)
router.get('/announcements', authenticate, (req, res) => {
  res.status(200).json({ success: true, message: 'Communications module endpoints active.' });
});

module.exports = router;
