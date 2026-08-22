const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');
const { upload } = require('../middleware/upload.middleware');

router.use(authenticate);

// Roster views open to Admin and Teachers
router.get('/', authorizeRoles('ADMIN', 'TEACHER'), studentController.getAllStudents);
router.get('/export', authorizeRoles('ADMIN', 'TEACHER'), studentController.exportStudentsToExcel);
router.get('/:id', authorizeRoles('ADMIN', 'TEACHER', 'PARENT', 'STUDENT'), studentController.getStudentById);

// Admissions and mutations restricted to Admin executive
router.post('/', authorizeRoles('ADMIN'), upload.single('photo'), studentController.createStudent);
router.post('/import/preview', authorizeRoles('ADMIN'), upload.single('file'), studentController.previewStudentImport);
router.post('/import/confirm', authorizeRoles('ADMIN'), studentController.confirmStudentImport);
router.put('/:id', authorizeRoles('ADMIN'), upload.single('photo'), studentController.updateStudent);
router.delete('/:id', authorizeRoles('ADMIN'), studentController.deleteStudent);
router.post('/promote', authorizeRoles('ADMIN'), studentController.promoteStudents);

module.exports = router;
