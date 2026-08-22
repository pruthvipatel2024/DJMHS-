const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ocrService = require('../services/ocr.service');
const { authenticate } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/rbac.middleware');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/ocr');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

/**
 * POST /api/ocr/staff-import
 * Uploads an image, runs preprocessing, Tesseract OCR, and duplicate detection
 */
router.post('/staff-import', authenticate, authorizeRoles('ADMIN'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No image uploaded' });
    }

    const inputPath = req.file.path;

    // 1. Image Preprocessing (Sharp)
    const processedPath = await ocrService.preprocessImage(inputPath);

    // 2. Tesseract OCR (Eng + Guj)
    const rawStaffData = await ocrService.performStaffOCR(processedPath);

    // 3. Duplicate Detection and Validation
    const validatedStaffData = await ocrService.detectDuplicates(rawStaffData);

    res.status(200).json({
      status: 'success',
      data: {
        imageUrl: `/uploads/ocr/${path.basename(processedPath)}`,
        extractedRows: validatedStaffData,
        count: validatedStaffData.length
      }
    });

  } catch (error) {
    console.error('OCR Route Error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Server error during OCR' });
  }
});

module.exports = router;
