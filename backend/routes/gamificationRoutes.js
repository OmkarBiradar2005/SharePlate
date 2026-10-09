const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getUserBadges,
  checkAndAwardBadges,
  getUserRank,
  initializeBadges
} = require('../controllers/gamificationController');

router.get('/badges', protect, getUserBadges);
router.post('/check-badges', protect, checkAndAwardBadges);
router.get('/rank', protect, getUserRank);
router.post('/initialize-badges', protect, initializeBadges);

module.exports = router;
