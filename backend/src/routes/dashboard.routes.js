const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

// Role-specific dashboard analytics endpoints
router.get('/admin', authenticate, authorizeRoles('ADMIN'), dashboardController.getAdminDashboardKPIs);
router.get('/teacher', authenticate, authorizeRoles('TEACHER', 'ADMIN'), dashboardController.getTeacherDashboard);
router.get('/portal', authenticate, authorizeRoles('STUDENT', 'PARENT', 'ADMIN'), dashboardController.getPortalDashboard);

module.exports = router;
