const express = require('express');
const router = express.Router();
const feeController = require('../controllers/fee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/installments', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), feeController.getFeeInstallments);
router.post('/collect', authorizeRoles('ADMIN'), feeController.collectFeePayment);
router.post('/remind-defaulters', authorizeRoles('ADMIN'), feeController.notifyDefaulters);
router.get('/receipt/pdf', authorizeRoles('ADMIN', 'TEACHER', 'STUDENT', 'PARENT'), feeController.downloadFeeReceiptPdf);

module.exports = router;
