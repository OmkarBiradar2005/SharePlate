const mongoose = require('mongoose');

const badgeSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['donation', 'impact', 'engagement', 'milestone', 'special'],
    required: true
  },
  criteria: {
    type: {
      type: String,
      enum: ['donation_count', 'meals_saved', 'carbon_saved', 'consecutive_days', 'rating_average', 'custom'],
      required: true
    },
    value: Number,
    customLogic: String
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const userBadgeSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  badgeId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Badge'
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: { type: Number, default: 0 },
    target: Number
  },
  isDisplayed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
userBadgeSchema.index({ userId: 1 });
userBadgeSchema.index({ badgeId: 1 });
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

module.exports = { Badge, UserBadge };
