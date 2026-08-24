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
const adminRoutes = require('./admin.routes');

// API Root Index Endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shree Dhaneshkumar Jasvantlal Maheta High School ERP API Gateway',
    version: '1.0.0',
    status: 'ONLINE',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      staff: '/api/staff',
      students: '/api/students',
      attendance: '/api/attendance',
      exams: '/api/exams',
      timetables: '/api/timetables',
      fees: '/api/fees',
      crm: '/api/crm',
      settings: '/api/settings',
      upload: '/api/upload',
    },
  });
});

// Mount Modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
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

