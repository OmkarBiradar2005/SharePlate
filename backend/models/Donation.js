const mongoose = require('mongoose');

const donationSchema = mongoose.Schema({
  foodName: {
    type: String,
    required: [true, 'Please add food name'],
    trim: true
  },
  quantity: {
    type: String,
    required: [true, 'Please add quantity'],
    trim: true
  },
  foodType: {
    type: String,
    required: [true, 'Please add food type'],
    enum: ['veg', 'nonveg'],
    lowercase: true
  },
  cookedTime: {
    type: Date,
    required: [true, 'Please add cooked time']
  },
  expiryTime: {
    type: Date,
    required: [true, 'Please add expiry time']
  },
  pickupAddress: {
    type: String,
    required: [true, 'Please add pickup address'],
    trim: true
  },
  location: {
    lat: {
      type: Number,
      default: null
    },
    lng: {
      type: Number,
      default: null
    }
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add contact number'],
    match: [/^\d{10,15}$/, 'Please add a valid contact number']
  },
  imageUrl: {
    type: String,
    default: null
  },
  images: [{
    url: String,
    publicId: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  scheduledPickup: {
    date: Date,
    timeSlot: String,
    confirmed: { type: Boolean, default: false }
  },
  qrCode: {
    type: String,
    default: null
  },
  tracking: {
    status: { type: String, enum: ['pending', 'on-the-way', 'arrived', 'picked-up'], default: 'pending' },
    location: {
      lat: Number,
      lng: Number
    },
    estimatedArrival: Date,
    updates: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      message: String
    }]
  },
  estimatedMeals: {
    type: Number,
    default: 0
  },
  carbonFootprintSaved: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSchedule: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    days: [Number],
    endDate: Date
  },
  pickupConfirmation: {
    code: String,
    confirmedAt: Date,
    photoUrl: String
  },
  views: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Add index for efficient queries
donationSchema.index({ status: 1 });
donationSchema.index({ donorId: 1 });
donationSchema.index({ acceptedBy: 1 });

module.exports = mongoose.model('Donation', donationSchema);