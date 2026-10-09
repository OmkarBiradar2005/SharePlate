// Impact Tracking Controller
const Impact = require('../models/Impact');
const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Create impact record
// @route   POST /api/impact/create
// @access  Private (NGO only)
const createImpact = async (req, res) => {
  try {
    const {
      donationId,
      mealsServed,
      beneficiaries,
      foodWeightKg,
      testimonial,
      verificationPhoto,
      distributionDetails
    } = req.body;

    const impact = await Impact.create({
      userId: req.user._id,
      donationId,
      mealsServed,
      beneficiaries,
      foodWeightKg,
      testimonial,
      verificationPhoto,
      distributionDetails
    });

    // Calculate environmental impact
    await impact.calculateEnvironmentalImpact();

    // Update donation with impact data
    await Donation.findByIdAndUpdate(donationId, {
      $set: {
        estimatedMeals: mealsServed,
        carbonFootprintSaved: impact.co2Saved
      }
    });

    // Award points to donor and NGO
    const donation = await Donation.findById(donationId);
    await User.findByIdAndUpdate(donation.donorId, {
      $inc: { points: mealsServed * 2 }
    });
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: mealsServed }
    });

    res.status(201).json({
      success: true,
      message: 'Impact recorded successfully',
      data: impact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's total impact
// @route   GET /api/impact/user/:userId
// @access  Public
const getUserImpact = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const impact = await Impact.getUserTotalImpact(userId);

    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get platform-wide impact
// @route   GET /api/impact/platform
// @access  Public
const getPlatformImpact = async (req, res) => {
  try {
    const impact = await Impact.getPlatformImpact();

    res.json({
      success: true,
      data: impact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get impact timeline
// @route   GET /api/impact/timeline
// @access  Private
const getImpactTimeline = async (req, res) => {
  try {
    const { period = '30days' } = req.query;
    
    let startDate = new Date();
    if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90days') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === '1year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const timeline = await Impact.aggregate([
      {
        $match: {
          userId: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          meals: { $sum: '$mealsServed' },
          beneficiaries: { $sum: '$beneficiaries' },
          co2: { $sum: '$co2Saved' },
          water: { $sum: '$waterSaved' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: timeline
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
  createImpact,
  getUserImpact,
  getPlatformImpact,
  getImpactTimeline
};
