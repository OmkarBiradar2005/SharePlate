// Food Safety Routes
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createFoodSafetyCheck,
  updatePostPickupCheck,
  updateDistributionCheck,
  getSafetyCheckByDonation
} = require('../controllers/foodSafetyController');

router.post('/create', protect, authorize('restaurant'), createFoodSafetyCheck);
router.put('/post-pickup/:id', protect, authorize('ngo'), updatePostPickupCheck);
router.put('/distribution/:id', protect, authorize('ngo'), updateDistributionCheck);
router.get('/donation/:donationId', protect, getSafetyCheckByDonation);

module.exports = router;
