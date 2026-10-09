const mongoose = require('mongoose');

const scheduleSchema = mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  donationTemplate: {
    foodName: String,
    quantity: String,
    foodType: { type: String, enum: ['veg', 'nonveg'] },
    pickupAddress: String,
    contactNumber: String
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    timeSlot: {
      start: String,
      end: String
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    daysOfMonth: [{
      type: Number,
      min: 1,
      max: 31
    }]
  },
  reminder: {
    enabled: { type: Boolean, default: true },
    minutesBefore: { type: Number, default: 30 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastExecuted: {
    type: Date,
    default: null
  },
  nextExecution: {
    type: Date,
    default: null
  },
  executionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ donorId: 1 });
scheduleSchema.index({ isActive: 1, nextExecution: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
