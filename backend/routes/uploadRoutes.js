const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadDonationImagesHandler,
  uploadProfileImageHandler,
  uploadVerificationDocumentHandler,
  deleteImageHandler
} = require('../controllers/uploadController');

router.post('/donation-images', protect, uploadDonationImagesHandler);
router.post('/profile-image', protect, uploadProfileImageHandler);
router.post('/verification-document', protect, uploadVerificationDocumentHandler);
router.delete('/image/:publicId', protect, deleteImageHandler);

module.exports = router;
