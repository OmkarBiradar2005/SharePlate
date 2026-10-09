const Review = require('../models/Review');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { donationId, revieweeId, rating, categories, comment, isAnonymous } = req.body;

    // Check if donation exists and is completed
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed donations'
      });
    }

    // Check if user is part of the donation
    if (donation.donorId.toString() !== req.user._id.toString() && 
        donation.acceptedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this donation'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      donationId,
      reviewerId: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this donation'
      });
    }

    const review = await Review.create({
      donationId,
      reviewerId: req.user._id,
      revieweeId,
      rating,
      categories,
      comment,
      isAnonymous
    });

    // Update user's rating
    const reviews = await Review.find({ revieweeId });
    const avgRating = reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length;
    
    await User.findByIdAndUpdate(revieweeId, {
      'rating.average': avgRating,
      'rating.count': reviews.length
    });

    await review.populate('reviewerId revieweeId', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ revieweeId: userId })
      .populate('reviewerId', 'name profileImage')
      .populate('donationId', 'foodName createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Review.countDocuments({ revieweeId: userId });

    res.json({
      success: true,
      data: reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update review (add response)
// @route   PUT /api/reviews/:id/response
// @access  Private
const addReviewResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.revieweeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    review.response = {
      text: req.body.text,
      respondedAt: Date.now()
    };

    await review.save();

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const index = review.helpful.indexOf(req.user._id);
    
    if (index > -1) {
      review.helpful.splice(index, 1);
    } else {
      review.helpful.push(req.user._id);
    }

    await review.save();

    res.json({
      success: true,
      data: review
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
  createReview,
  getUserReviews,
  addReviewResponse,
  markHelpful
};
