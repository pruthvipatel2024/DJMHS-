const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(authenticate);

// Directory view accessible by both Admin and Teachers
router.get('/', authorizeRoles('ADMIN', 'TEACHER'), staffController.getAllStaff);
router.get('/:id', authorizeRoles('ADMIN', 'TEACHER'), staffController.getStaffById);

// Operations restricted to Executive Admin
router.post('/', authorizeRoles('ADMIN'), upload.single('photo'), staffController.createStaff);
router.put('/:id', authorizeRoles('ADMIN'), upload.single('photo'), staffController.updateStaff);
router.delete('/:id', authorizeRoles('ADMIN'), staffController.deleteStaff);
router.post('/bulk-import', authorizeRoles('ADMIN'), upload.single('spreadsheet'), staffController.bulkImportStaff);

module.exports = router;
