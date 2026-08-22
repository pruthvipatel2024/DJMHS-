const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Stub router - upgraded in Phase 14 (Reports Repository & Settings)
router.get('/', authenticate, (req, res) => {
  res.status(200).json({ success: true, message: 'Reports generator endpoint active.' });
});

module.exports = router;
