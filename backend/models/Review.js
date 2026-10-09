const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Donation'
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5
  },
  categories: {
    punctuality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    foodQuality: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },
  comment: {
    type: String,
    maxlength: 500
  },
  response: {
    text: String,
    respondedAt: Date
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  helpful: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ donationId: 1 });
reviewSchema.index({ reviewerId: 1 });
reviewSchema.index({ revieweeId: 1 });
reviewSchema.index({ rating: 1 });

// Prevent duplicate reviews
reviewSchema.index({ donationId: 1, reviewerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
