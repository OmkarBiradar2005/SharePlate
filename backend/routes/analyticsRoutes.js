const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardAnalytics,
  getLeaderboard,
  getSystemStats
} = require('../controllers/analyticsController');

router.get('/dashboard', protect, getDashboardAnalytics);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getSystemStats);

module.exports = router;
