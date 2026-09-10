const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

// User notification endpoints
router.get('/', notificationController.getNotifications);
router.patch('/mark-all-read', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Admin dispatch endpoint
router.post('/broadcast', authorizeRoles('ADMIN'), notificationController.broadcastNotification);

module.exports = router;
