const { uploadDonationImages, uploadProfileImage, uploadDocument, deleteImage } = require('../config/cloudinary');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Upload donation images
// @route   POST /api/upload/donation-images
// @access  Private
const uploadDonationImagesHandler = async (req, res) => {
  try {
    const upload = uploadDonationImages.array('images', 5);
    
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const images = req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      }));

      res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: images
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload profile image
// @route   POST /api/upload/profile-image
// @access  Private
const uploadProfileImageHandler = async (req, res) => {
  try {
    const upload = uploadProfileImage.single('image');
    
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Update user profile
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: req.file.path },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          url: req.file.path,
          publicId: req.file.filename,
          user
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload verification document
// @route   POST /api/upload/verification-document
// @access  Private
const uploadVerificationDocumentHandler = async (req, res) => {
  try {
    const upload = uploadDocument.single('document');
    
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Add document to user's verification documents
      const user = await User.findById(req.user._id);
      
      user.verificationDocuments.push({
        documentType: req.body.documentType || 'general',
        documentUrl: req.file.path,
        uploadedAt: Date.now()
      });

      await user.save();

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          url: req.file.path,
          publicId: req.file.filename
        }
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/image/:publicId
// @access  Private
const deleteImageHandler = async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await deleteImage(publicId);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete image'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  uploadDonationImagesHandler,
  uploadProfileImageHandler,
  uploadVerificationDocumentHandler,
  deleteImageHandler
};
