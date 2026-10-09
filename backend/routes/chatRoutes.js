const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrGetChat,
  sendMessage,
  getUserChats,
  markAsRead
} = require('../controllers/chatController');

router.post('/', protect, createOrGetChat);
router.get('/', protect, getUserChats);
router.post('/:chatId/messages', protect, sendMessage);
router.put('/:chatId/read', protect, markAsRead);

module.exports = router;
