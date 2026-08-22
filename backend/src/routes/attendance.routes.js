const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/division', authorizeRoles('ADMIN', 'TEACHER'), attendanceController.getAttendanceByDivision);
router.post('/mark', authorizeRoles('ADMIN', 'TEACHER'), attendanceController.markAttendance);
router.get('/report', authorizeRoles('ADMIN', 'TEACHER'), attendanceController.getAttendanceReport);

module.exports = router;
