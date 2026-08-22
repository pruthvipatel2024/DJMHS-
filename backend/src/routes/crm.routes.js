const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crm.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

// Admission Inquiry routes
router.get('/inquiries', authorizeRoles('ADMIN', 'TEACHER'), crmController.getInquiries);
router.post('/inquiries', authorizeRoles('ADMIN', 'TEACHER'), crmController.createInquiry);
router.post('/inquiries/:id/convert', authorizeRoles('ADMIN'), crmController.convertInquiryToStudent);

// Complaint Helpdesk routes
router.get('/complaints', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), crmController.getComplaints);
router.post('/complaints', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), crmController.createComplaint);
router.put('/complaints/:id', authorizeRoles('ADMIN', 'TEACHER'), crmController.resolveComplaint);

// Circular Broadcast Announcements
router.get('/announcements', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), crmController.getAnnouncements);
router.post('/announcements', authorizeRoles('ADMIN'), crmController.broadcastAnnouncement);

module.exports = router;
