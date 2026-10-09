const User = require('../models/User');
const Donation = require('../models/Donation');
const Review = require('../models/Review');
const { Badge, UserBadge } = require('../models/Badge');
const Notification = require('../models/Notification');

// @desc    Get user's badges
// @route   GET /api/gamification/badges
// @access  Private
const getUserBadges = async (req, res) => {
  try {
    const userBadges = await UserBadge.find({ userId: req.user._id })
      .populate('badgeId')
      .sort({ earnedAt: -1 });

    const allBadges = await Badge.find({ isActive: true });
    
    // Calculate progress for locked badges
    const badgesWithProgress = await Promise.all(allBadges.map(async (badge) => {
      const earned = userBadges.find(ub => ub.badgeId._id.toString() === badge._id.toString());
      
      if (earned) {
        return {
          ...badge.toObject(),
          earned: true,
          earnedAt: earned.earnedAt,
          progress: { current: badge.criteria.value, target: badge.criteria.value }
        };
      }

      // Calculate progress
      const progress = await calculateBadgeProgress(req.user._id, badge);
      
      return {
        ...badge.toObject(),
        earned: false,
        progress
      };
    }));

    res.json({
      success: true,
      data: {
        earned: userBadges.length,
        total: allBadges.length,
        badges: badgesWithProgress
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to calculate badge progress
const calculateBadgeProgress = async (userId, badge) => {
  let current = 0;
  const target = badge.criteria.value;

  switch (badge.criteria.type) {
    case 'donation_count':
      current = await Donation.countDocuments({ donorId: userId, status: 'completed' });
      break;
    case 'meals_saved':
      const donations = await Donation.find({ donorId: userId, status: 'completed' });
      current = donations.reduce((sum, d) => sum + (d.estimatedMeals || 0), 0);
      break;
    case 'carbon_saved':
      const carbonDonations = await Donation.find({ donorId: userId, status: 'completed' });
      current = carbonDonations.reduce((sum, d) => sum + (d.carbonFootprintSaved || 0), 0);
      break;
    case 'rating_average':
      const user = await User.findById(userId);
      current = user.rating.average;
      break;
  }

  return { current, target };
};

// @desc    Check and award badges
// @route   POST /api/gamification/check-badges
// @access  Private
const checkAndAwardBadges = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const allBadges = await Badge.find({ isActive: true });
    const earnedBadges = await UserBadge.find({ userId: user._id });
    const earnedBadgeIds = earnedBadges.map(ub => ub.badgeId.toString());

    const newBadges = [];

    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge._id.toString())) continue;

      const progress = await calculateBadgeProgress(user._id, badge);
      
      if (progress.current >= progress.target) {
        // Award badge
        const userBadge = await UserBadge.create({
          userId: user._id,
          badgeId: badge._id,
          progress
        });

        // Update user points
        user.points += badge.points;
        user.badges.push(badge.name);
        
        newBadges.push(badge);

        // Create notification
        await Notification.create({
          userId: user._id,
          type: 'badge_earned',
          title: 'New Badge Earned!',
          message: `Congratulations! You've earned the "${badge.name}" badge!`,
          data: { link: '/profile/badges' },
          priority: 'high'
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      message: newBadges.length > 0 ? 'New badges awarded!' : 'No new badges',
      data: {
        newBadges,
        totalPoints: user.points
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's rank and position
// @route   GET /api/gamification/rank
// @access  Private
const getUserRank = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const higherRanked = await User.countDocuments({
      points: { $gt: user.points },
      isActive: true
    });

    const rank = higherRanked + 1;
    const totalUsers = await User.countDocuments({ isActive: true });
    const percentile = ((totalUsers - rank) / totalUsers * 100).toFixed(1);

    // Get rank tier
    let tier = 'Bronze';
    if (user.points >= 10000) tier = 'Diamond';
    else if (user.points >= 5000) tier = 'Platinum';
    else if (user.points >= 2500) tier = 'Gold';
    else if (user.points >= 1000) tier = 'Silver';

    res.json({
      success: true,
      data: {
        points: user.points,
        rank,
        totalUsers,
        percentile,
        tier,
        badges: user.badges.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create default badges (admin only)
// @route   POST /api/gamification/initialize-badges
// @access  Private/Admin
const initializeBadges = async (req, res) => {
  try {
    const defaultBadges = [
      {
        name: 'First Donation',
        description: 'Complete your first food donation',
        icon: '🎉',
        category: 'milestone',
        criteria: { type: 'donation_count', value: 1 },
        rarity: 'common',
        points: 50
      },
      {
        name: 'Generous Donor',
        description: 'Complete 10 donations',
        icon: '🌟',
        category: 'milestone',
        criteria: { type: 'donation_count', value: 10 },
        rarity: 'rare',
        points: 200
      },
      {
        name: 'Food Hero',
        description: 'Complete 50 donations',
        icon: '🦸',
        category: 'milestone',
        criteria: { type: 'donation_count', value: 50 },
        rarity: 'epic',
        points: 500
      },
      {
        name: 'Legendary Donor',
        description: 'Complete 100 donations',
        icon: '👑',
        category: 'milestone',
        criteria: { type: 'donation_count', value: 100 },
        rarity: 'legendary',
        points: 1000
      },
      {
        name: 'Meal Saver',
        description: 'Save 100 meals',
        icon: '🍽️',
        category: 'impact',
        criteria: { type: 'meals_saved', value: 100 },
        rarity: 'rare',
        points: 300
      },
      {
        name: 'Carbon Warrior',
        description: 'Save 50kg of CO2',
        icon: '🌍',
        category: 'impact',
        criteria: { type: 'carbon_saved', value: 50 },
        rarity: 'epic',
        points: 400
      },
      {
        name: 'Five Star',
        description: 'Achieve 4.5+ average rating',
        icon: '⭐',
        category: 'engagement',
        criteria: { type: 'rating_average', value: 4.5 },
        rarity: 'epic',
        points: 350
      }
    ];

    const badges = await Badge.insertMany(defaultBadges);

    res.json({
      success: true,
      message: 'Badges initialized successfully',
      data: badges
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
  getUserBadges,
  checkAndAwardBadges,
  getUserRank,
  initializeBadges
};
