const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'location'],
    default: 'text'
  },
  attachment: {
    url: String,
    name: String,
    size: Number
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Donation'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }],
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ donationId: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ 'messages.sender': 1 });

module.exports = mongoose.model('Chat', chatSchema);
