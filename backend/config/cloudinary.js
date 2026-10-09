const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for donation images
const donationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shareplate/donations',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shareplate/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }]
  }
});

// Storage for verification documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shareplate/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto'
  }
});

// Storage for blog images
const blogStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shareplate/blog',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'limit' }]
  }
});

// Multer upload configurations
const uploadDonationImages = multer({
  storage: donationStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadProfileImage = multer({
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadBlogImage = multer({
  storage: blogStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Helper function to delete image from cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadDonationImages,
  uploadProfileImage,
  uploadDocument,
  uploadBlogImage,
  deleteImage
};
