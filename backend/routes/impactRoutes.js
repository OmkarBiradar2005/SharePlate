// Impact Routes
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createImpact,
  getUserImpact,
  getPlatformImpact,
  getImpactTimeline
} = require('../controllers/impactController');

router.post('/create', protect, authorize('ngo'), createImpact);
router.get('/user/:userId', getUserImpact);
router.get('/platform', getPlatformImpact);
router.get('/timeline', protect, getImpactTimeline);

module.exports = router;
