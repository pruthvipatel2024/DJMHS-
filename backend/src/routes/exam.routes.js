const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), examController.getAllExams);
router.post('/', authorizeRoles('ADMIN'), examController.createExam);
router.get('/marksheet', authorizeRoles('ADMIN', 'TEACHER'), examController.getMarkSheet);
router.post('/marks', authorizeRoles('ADMIN', 'TEACHER'), examController.submitMarks);
router.get('/report-card/pdf', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), examController.downloadReportCardPdf);

module.exports = router;
