const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createDonation,
  getDonations,
  getMyDonations,
  getDonation,
  acceptDonation,
  updateDonationStatus,
  deleteDonation
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

// Create donation validation
const createDonationValidation = [
  body('foodName')
    .notEmpty()
    .withMessage('Food name is required')
    .trim(),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .trim(),
  body('foodType')
    .isIn(['veg', 'nonveg'])
    .withMessage('Food type must be either veg or nonveg'),
  body('cookedTime')
    .isISO8601()
    .withMessage('Please provide a valid cooked time')
    .toDate(),
  body('expiryTime')
    .isISO8601()
    .withMessage('Please provide a valid expiry time')
    .toDate(),
  body('pickupAddress')
    .notEmpty()
    .withMessage('Pickup address is required')
    .trim(),
  body('contactNumber')
    .matches(/^\d{10,15}$/)
    .withMessage('Please provide a valid contact number')
];

// Update status validation
const updateStatusValidation = [
  body('status')
    .isIn(['completed', 'cancelled'])
    .withMessage('Status must be either completed or cancelled')
];

// @route   POST /api/donations/create
router.post('/create', protect, authorize('restaurant'), createDonationValidation, createDonation);

// @route   GET /api/donations
router.get('/', protect, getDonations);

// @route   GET /api/donations/my
router.get('/my', protect, authorize('restaurant'), getMyDonations);

// @route   GET /api/donations/:id
router.get('/:id', protect, getDonation);

// @route   PUT /api/donations/accept/:id
router.put('/accept/:id', protect, authorize('ngo'), acceptDonation);

// @route   PUT /api/donations/status/:id
router.put('/status/:id', protect, updateStatusValidation, updateDonationStatus);

// @route   DELETE /api/donations/:id
router.delete('/:id', protect, authorize('restaurant'), deleteDonation);

module.exports = router;