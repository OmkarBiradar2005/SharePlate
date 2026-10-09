const Chat = require('../models/Chat');
const Donation = require('../models/Donation');

// @desc    Create or get chat
// @route   POST /api/chats
// @access  Private
const createOrGetChat = async (req, res) => {
  try {
    const { donationId } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Check if user is authorized
    if (donation.donorId.toString() !== req.user._id.toString() && 
        donation.acceptedBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if chat exists
    let chat = await Chat.findOne({ donationId })
      .populate('participants', 'name profileImage role')
      .populate('messages.sender', 'name profileImage');

    if (!chat) {
      // Create new chat
      const participants = [donation.donorId];
      if (donation.acceptedBy) {
        participants.push(donation.acceptedBy);
      }

      chat = await Chat.create({
        donationId,
        participants
      });

      await chat.populate('participants', 'name profileImage role');
    }

    res.json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send message
// @route   POST /api/chats/:chatId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type = 'text', attachment } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const message = {
      sender: req.user._id,
      content,
      type,
      attachment
    };

    chat.messages.push(message);
    chat.lastMessage = {
      content,
      sender: req.user._id,
      timestamp: Date.now()
    };

    await chat.save();
    await chat.populate('messages.sender', 'name profileImage');

    // Emit socket event (will be handled by socket.io)
    req.app.get('io').to(chatId).emit('new_message', {
      chatId,
      message: chat.messages[chat.messages.length - 1]
    });

    res.status(201).json({
      success: true,
      data: chat.messages[chat.messages.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
      .populate('participants', 'name profileImage role')
      .populate('donationId', 'foodName status')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    chat.messages.forEach(msg => {
      if (msg.sender.toString() !== req.user._id.toString()) {
        const readIndex = msg.readBy.findIndex(
          r => r.user.toString() === req.user._id.toString()
        );
        
        if (readIndex === -1) {
          msg.readBy.push({
            user: req.user._id,
            readAt: Date.now()
          });
        }
      }
    });

    await chat.save();

    res.json({
      success: true,
      message: 'Messages marked as read'
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
  createOrGetChat,
  sendMessage,
  getUserChats,
  markAsRead
};
