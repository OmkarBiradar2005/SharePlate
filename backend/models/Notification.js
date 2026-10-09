const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'donation_accepted',
      'donation_completed',
      'donation_cancelled',
      'donation_expiring',
      'new_donation_available',
      'new_message',
      'new_review',
      'badge_earned',
      'verification_approved',
      'verification_rejected',
      'pickup_reminder',
      'system_announcement'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    link: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  channels: {
    push: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
