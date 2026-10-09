const User = require('../models/User');
const Donation = require('../models/Donation');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { Badge, UserBadge } = require('../models/Badge');
const Blog = require('../models/Blog');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'restaurant' });
    const totalNGOs = await User.countDocuments({ role: 'ngo' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const pendingVerifications = await User.countDocuments({ 
      verificationDocuments: { $exists: true, $ne: [] },
      isVerified: false 
    });

    const totalDonations = await Donation.countDocuments();
    const pendingDonations = await Donation.countDocuments({ status: 'pending' });
    const completedDonations = await Donation.countDocuments({ status: 'completed' });

    const totalReviews = await Review.countDocuments();
    const avgRating = await Review.aggregate([
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt isVerified');

    const recentDonations = await Donation.find()
      .populate('donorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          donors: totalDonors,
          ngos: totalNGOs,
          verified: verifiedUsers,
          pendingVerification: pendingVerifications
        },
        donations: {
          total: totalDonations,
          pending: pendingDonations,
          completed: completedDonations
        },
        reviews: {
          total: totalReviews,
          averageRating: avgRating[0]?.avg || 0
        },
        recent: {
          users: recentUsers,
          donations: recentDonations
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

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, verified, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (verified !== undefined) query.isVerified = verified === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify user
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
const verifyUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isVerified = true;
    user.verifiedAt = Date.now();
    user.verifiedBy = req.user._id;
    await user.save();

    // Create notification
    await Notification.create({
      userId: user._id,
      type: 'verification_approved',
      title: 'Account Verified!',
      message: 'Your account has been verified. You now have full access to all features.',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'User verified successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all donations
// @route   GET /api/admin/donations
// @access  Private/Admin
const getAllDonations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const donations = await Donation.find(query)
      .populate('donorId', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Donation.countDocuments(query);

    res.json({
      success: true,
      data: donations,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send system announcement
// @route   POST /api/admin/announcement
// @access  Private/Admin
const sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole, priority = 'medium' } = req.body;

    let query = { isActive: true };
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    }

    const users = await User.find(query);

    const notifications = users.map(user => ({
      userId: user._id,
      type: 'system_announcement',
      title,
      message,
      priority
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Announcement sent to ${users.length} users`
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
  getAdminDashboard,
  getAllUsers,
  verifyUser,
  deactivateUser,
  getAllDonations,
  sendAnnouncement
};
