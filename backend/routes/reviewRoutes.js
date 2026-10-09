const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReview,
  getUserReviews,
  addReviewResponse,
  markHelpful
} = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.put('/:id/response', protect, addReviewResponse);
router.put('/:id/helpful', protect, markHelpful);

module.exports = router;
