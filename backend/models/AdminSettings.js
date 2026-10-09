const mongoose = require('mongoose');

const adminSettingsSchema = mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'email', 'sms', 'notification', 'security', 'analytics', 'feature-flags'],
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
adminSettingsSchema.index({ key: 1 });
adminSettingsSchema.index({ category: 1 });

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);
