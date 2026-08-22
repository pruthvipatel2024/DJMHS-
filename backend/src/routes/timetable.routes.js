const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), timetableController.getTimetable);
router.post('/slot', authorizeRoles('ADMIN'), timetableController.setTimetableSlot);
router.delete('/slot/:id', authorizeRoles('ADMIN'), timetableController.deleteTimetableSlot);

// Automatic Timetable Draft Generator Endpoints
router.post('/generate-draft', authorizeRoles('ADMIN'), timetableController.handleGenerateDraft);
router.put('/update-draft-slot', authorizeRoles('ADMIN'), timetableController.handleUpdateDraftSlot);
router.post('/approve-draft', authorizeRoles('ADMIN'), timetableController.handleApproveDraft);

module.exports = router;
