const Donation = require('../models/Donation');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Get analytics dashboard data
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let analytics = {};

    if (userRole === 'restaurant') {
      // Restaurant analytics
      const totalDonations = await Donation.countDocuments({ donorId: userId });
      const completedDonations = await Donation.countDocuments({ 
        donorId: userId, 
        status: 'completed' 
      });
      const pendingDonations = await Donation.countDocuments({ 
        donorId: userId, 
        status: 'pending' 
      });

      // Calculate total meals and carbon saved
      const donations = await Donation.find({ donorId: userId, status: 'completed' });
      const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedMeals || 0), 0);
      const carbonSaved = donations.reduce((sum, d) => sum + (d.carbonFootprintSaved || 0), 0);

      // Monthly trend
      const monthlyData = await getMonthlyTrend(userId, userRole);

      analytics = {
        totalDonations,
        completedDonations,
        pendingDonations,
        totalMeals,
        carbonSaved: carbonSaved.toFixed(2),
        rating: req.user.rating,
        monthlyTrend: monthlyData,
        impact: {
          mealsServed: totalMeals,
          peopleHelped: Math.floor(totalMeals / 3), // Assuming 3 meals per person per day
          carbonOffset: carbonSaved.toFixed(2)
        }
      };
    } else if (userRole === 'ngo') {
      // NGO analytics
      const totalPickups = await Donation.countDocuments({ acceptedBy: userId });
      const completedPickups = await Donation.countDocuments({ 
        acceptedBy: userId, 
        status: 'completed' 
      });
      const pendingPickups = await Donation.countDocuments({ 
        acceptedBy: userId, 
        status: 'accepted' 
      });

      const donations = await Donation.find({ acceptedBy: userId, status: 'completed' });
      const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedMeals || 0), 0);
      const carbonSaved = donations.reduce((sum, d) => sum + (d.carbonFootprintSaved || 0), 0);

      const monthlyData = await getMonthlyTrend(userId, userRole);

      analytics = {
        totalPickups,
        completedPickups,
        pendingPickups,
        totalMeals,
        carbonSaved: carbonSaved.toFixed(2),
        rating: req.user.rating,
        monthlyTrend: monthlyData,
        impact: {
          mealsCollected: totalMeals,
          peopleServed: Math.floor(totalMeals / 3),
          carbonOffset: carbonSaved.toFixed(2)
        }
      };
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to get monthly trend
const getMonthlyTrend = async (userId, role) => {
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    let query = {
      createdAt: {
        $gte: date,
        $lt: nextMonth
      },
      status: 'completed'
    };

    if (role === 'restaurant') {
      query.donorId = userId;
    } else {
      query.acceptedBy = userId;
    }

    const count = await Donation.countDocuments(query);
    
    months.push({
      month: date.toLocaleString('default', { month: 'short' }),
      count
    });
  }

  return months;
};

// @desc    Get leaderboard
// @route   GET /api/analytics/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const { type = 'donations', period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'month') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    } else if (period === 'week') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: oneWeekAgo } };
    }

    let leaderboard = [];

    if (type === 'donations') {
      // Top donors
      leaderboard = await User.find({ role: 'restaurant', isActive: true })
        .select('name profileImage totalDonations rating points')
        .sort({ totalDonations: -1 })
        .limit(10);
    } else if (type === 'pickups') {
      // Top NGOs
      leaderboard = await User.find({ role: 'ngo', isActive: true })
        .select('name profileImage totalPickups rating points')
        .sort({ totalPickups: -1 })
        .limit(10);
    } else if (type === 'points') {
      // Top by points
      leaderboard = await User.find({ isActive: true })
        .select('name profileImage role points totalDonations totalPickups rating')
        .sort({ points: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get system-wide statistics
// @route   GET /api/analytics/stats
// @access  Public
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalDonors = await User.countDocuments({ role: 'restaurant', isActive: true });
    const totalNGOs = await User.countDocuments({ role: 'ngo', isActive: true });
    
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    
    const donations = await Donation.find({ status: 'completed' });
    const totalMeals = donations.reduce((sum, d) => sum + (d.estimatedMeals || 0), 0);
    const totalCarbon = donations.reduce((sum, d) => sum + (d.carbonFootprintSaved || 0), 0);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          ngos: totalNGOs
        },
        donations: {
          total: totalDonations,
          completed: completedDonations,
          successRate: ((completedDonations / totalDonations) * 100).toFixed(2)
        },
        impact: {
          totalMeals,
          carbonSaved: totalCarbon.toFixed(2),
          peopleHelped: Math.floor(totalMeals / 3)
        }
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

module.exports = {
  getDashboardAnalytics,
  getLeaderboard,
  getSystemStats
};
