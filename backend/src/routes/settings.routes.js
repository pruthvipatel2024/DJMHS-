const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

// Public route for frontend ThemeProvider
router.get('/school-profile', settingsController.getSchoolProfile);

router.use(authenticate);

// Directory/metadata lookup open to Admin and Teachers
router.get('/', authorizeRoles('ADMIN', 'TEACHER'), settingsController.getSettings);
router.get('/subjects', authorizeRoles('ADMIN', 'TEACHER'), settingsController.getSubjects);
router.get('/subject-allocations', authorizeRoles('ADMIN', 'TEACHER'), settingsController.getSubjectAllocations);

// Mutations restricted to Admin
router.use(authorizeRoles('ADMIN'));
router.post('/param', settingsController.updateSetting);

// Department CRUD
router.post('/department', settingsController.createDepartment);
router.put('/department/:id', settingsController.updateDepartment);
router.delete('/department/:id', settingsController.deleteDepartment);

// Standard CRUD
router.post('/standard', settingsController.createStandard);
router.put('/standard/:id', settingsController.updateStandard);
router.delete('/standard/:id', settingsController.deleteStandard);

// Division CRUD
router.post('/division', settingsController.createDivision);
router.put('/division/:id', settingsController.updateDivision);
router.delete('/division/:id', settingsController.deleteDivision);

// Subject Management CRUD
router.post('/subject', settingsController.createSubject);
router.put('/subject/:id', settingsController.updateSubject);
router.delete('/subject/:id', settingsController.deleteSubject);

// Teacher Subject & Class Allocation CRUD
router.post('/subject-allocations', settingsController.assignStaffSubject);
router.post('/subject-allocations/bulk', settingsController.bulkSaveClassSubjectAssignments);
router.delete('/subject-allocations/:id', settingsController.deleteSubjectAllocation);

module.exports = router;

