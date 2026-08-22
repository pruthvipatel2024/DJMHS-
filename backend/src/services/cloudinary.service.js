const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const getCloudinaryConfig = () => {
  const cloud_name = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const api_key = (process.env.CLOUDINARY_API_KEY || '').trim();
  const api_secret = (process.env.CLOUDINARY_API_SECRET || '').trim();

  return {
    cloud_name,
    api_key,
    api_secret,
    isConfigured: !!(cloud_name && api_key && api_secret && api_secret !== 'your_cloudinary_api_secret'),
  };
};

const isCloudinaryConfigured = () => {
  return getCloudinaryConfig().isConfigured;
};

/**
 * Upload image asset directly to Cloudinary
 */
const uploadMediaAsset = async (filePath, folderName = 'djmhs_erp') => {
  if (!filePath) return null;

  const cfg = getCloudinaryConfig();

  if (cfg.isConfigured) {
    cloudinary.config({
      cloud_name: cfg.cloud_name,
      api_key: cfg.api_key,
      api_secret: cfg.api_secret,
      secure: true,
    });

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folderName,
        resource_type: 'image',
      });

      // Remove temporary file from local uploads/ directory after cloud upload
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Temp file cleanup notice:', e.message);
      }

      return {
        photoUrl: result.secure_url,
        cloudinaryPublicId: result.public_id,
        secureUrl: result.secure_url,
        resourceType: result.resource_type,
      };
    } catch (err) {
      console.error('❌ Cloudinary Upload Failed:', err.message);

      // Clean up local temp file even on upload failure so duplicate files do not linger
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}

      // If credentials fail (e.g. cloud_name mismatch), throw clear error instead of swallowing silently
      throw new Error(`Cloudinary Upload Error (${err.message}). Please verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.`);
    }
  }

  // Local fallback if Cloudinary is explicitly unconfigured
  const normalizedPath = filePath.replace(/\\/g, '/');
  const filename = normalizedPath.split('/').pop();
  return {
    photoUrl: `/uploads/${filename}`,
    cloudinaryPublicId: null,
    secureUrl: `/uploads/${filename}`,
    resourceType: 'image',
  };
};

/**
 * Delete image asset from Cloudinary by publicId
 */
const deleteMediaAsset = async (publicId) => {
  if (!publicId) return false;
  const cfg = getCloudinaryConfig();
  if (!cfg.isConfigured) return false;

  try {
    cloudinary.config({
      cloud_name: cfg.cloud_name,
      api_key: cfg.api_key,
      api_secret: cfg.api_secret,
      secure: true,
    });
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (err) {
    console.warn('⚠️ Failed to delete Cloudinary asset:', err.message);
    return false;
  }
};

module.exports = {
  uploadMediaAsset,
  deleteMediaAsset,
  isCloudinaryConfigured,
};
