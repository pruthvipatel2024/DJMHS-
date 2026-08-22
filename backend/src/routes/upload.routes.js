const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { upload } = require('../middleware/upload.middleware');
const { uploadMediaAsset, deleteMediaAsset } = require('../services/cloudinary.service');

router.use(authenticate);

/**
 * Standalone photo upload endpoint for Student and Staff photo management
 */
router.post('/photo', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No File Provided',
        message: 'Please select an image file to upload.',
      });
    }

    const folder = req.query.folder || 'djmhs_erp';
    const asset = await uploadMediaAsset(req.file.path, folder);

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully.',
      data: asset,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Delete photo asset endpoint
 */
router.delete('/photo', async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Missing Public ID',
        message: 'Public ID is required to remove photo asset.',
      });
    }

    const result = await deleteMediaAsset(publicId);
    res.status(200).json({
      success: true,
      message: result ? 'Photo asset deleted.' : 'Local asset cleared.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
