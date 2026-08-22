const express = require('express');
const router = express.Router();

// Import Feature Route Modules
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const staffRoutes = require('./staff.routes');
const studentRoutes = require('./student.routes');
const attendanceRoutes = require('./attendance.routes');
const examRoutes = require('./exam.routes');
const timetableRoutes = require('./timetable.routes');
const feeRoutes = require('./fee.routes');
const communicationRoutes = require('./communication.routes');
const reportRoutes = require('./report.routes');
const settingsRoutes = require('./settings.routes');
const crmRoutes = require('./crm.routes');
const uploadRoutes = require('./upload.routes');

// Mount Modules
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/staff', staffRoutes);
router.use('/students', studentRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/timetables', timetableRoutes);
router.use('/fees', feeRoutes);
router.use('/communications', communicationRoutes);
router.use('/crm', crmRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

