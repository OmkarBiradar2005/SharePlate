const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');
const QRCode = require('qrcode');
const { calculateUrgency } = require('../utils/urgencyCalculator');
const { notifyMatchingNGOs } = require('../utils/matchingAlgorithm');
const { sendUrgentDonationAlert } = require('../utils/smsService');

// @desc    Create a new donation
// @route   POST /api/donations/create
// @access  Private (Restaurant only)
const createDonation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      foodName,
      quantity,
      foodType,
      cookedTime,
      expiryTime,
      pickupAddress,
      location,
      contactNumber,
      imageUrl,
      images,
      estimatedMeals,
      tags,
      isRecurring,
      recurringSchedule
    } = req.body;

    // Calculate urgency based on expiration time
    const urgency = calculateUrgency(expiryTime);

    // Calculate carbon footprint (rough estimate: 2.5 kg CO2 per kg of food waste prevented)
    const carbonFootprintSaved = estimatedMeals ? (estimatedMeals * 0.5 * 2.5) : 0;

    const donation = await Donation.create({
      foodName,
      quantity,
      foodType,
      cookedTime,
      expiryTime,
      pickupAddress,
      location,
      contactNumber,
      imageUrl,
      images,
      estimatedMeals,
      carbonFootprintSaved,
      tags,
      isRecurring,
      recurringSchedule,
      donorId: req.user._id
    });

    // Generate QR code
    const qrData = JSON.stringify({
      id: donation._id,
      foodName: donation.foodName,
      donor: req.user.name
    });
    const qrCode = await QRCode.toDataURL(qrData);
    donation.qrCode = qrCode;
    await donation.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDonations: 1, points: 10 }
    });

    // Get socket.io instance from app
    const io = req.app.get('io');

    // Auto-match and notify NGOs if enabled
    if (process.env.ENABLE_AUTO_MATCHING === 'true') {
      const donationWithUrgency = { ...donation.toObject(), urgency };
      const matches = await notifyMatchingNGOs(donationWithUrgency, io);
      
      // If urgent and SMS enabled, send SMS to top matches
      if (urgency.level === 'critical' || urgency.level === 'urgent') {
        if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true' && matches.length > 0) {
          for (let i = 0; i < Math.min(3, matches.length); i++) {
            await sendUrgentDonationAlert(matches[i].ngo, donationWithUrgency);
          }
        }
      }
    }

    // Emit socket event for real-time updates
    if (io) {
      io.emit('new_donation', {
        ...donation.toObject(),
        urgency,
        donor: {
          id: req.user._id,
          name: req.user.name
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Donation created successfully',
      data: {
        ...donation.toObject(),
        urgency
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

// @desc    Get all donations (with advanced filters and search)
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res) => {
  try {
    const { 
      status, 
      foodType, 
      search, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1,
      limit = 10,
      lat,
      lng,
      maxDistance
    } = req.query;
    
    let query = {};

    // Status filter
    if (status) {
      query.status = status;
    } else {
      // Default to show only pending and accepted
      query.status = { $in: ['pending', 'accepted'] };
    }

    // Food type filter
    if (foodType) {
      query.foodType = foodType;
    }

    // Search filter
    if (search) {
      query.$or = [
        { foodName: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location-based filter
    if (lat && lng && maxDistance) {
      query['location.lat'] = { $exists: true };
      query['location.lng'] = { $exists: true };
    }

    const donations = await Donation.find(query)
      .populate('donorId', 'name phone address profileImage rating isVerified')
      .populate('acceptedBy', 'name phone address profileImage')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Calculate distance if location provided
    let donationsWithDistance = donations;
    if (lat && lng) {
      donationsWithDistance = donations.map(donation => {
        const donationObj = donation.toObject();
        if (donation.location.lat && donation.location.lng) {
          const distance = calculateDistance(
            parseFloat(lat),
            parseFloat(lng),
            donation.location.lat,
            donation.location.lng
          );
          donationObj.distance = distance;
        }
        return donationObj;
      });

      // Filter by max distance if specified
      if (maxDistance) {
        donationsWithDistance = donationsWithDistance.filter(
          d => !d.distance || d.distance <= parseFloat(maxDistance)
        );
      }

      // Sort by distance if requested
      if (sortBy === 'distance') {
        donationsWithDistance.sort((a, b) => {
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return order === 'asc' ? distA - distB : distB - distA;
        });
      }
    }

    const count = await Donation.countDocuments(query);

    res.json({
      success: true,
      count: donationsWithDistance.length,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: donationsWithDistance
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

// @desc    Get user's donations (Restaurant only)
// @route   GET /api/donations/my
// @access  Private (Restaurant only)
const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate('acceptedBy', 'name phone address')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: donations.length,
      data: donations
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single donation
// @route   GET /api/donations/:id
// @access  Private
const getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name phone address email')
      .populate('acceptedBy', 'name phone address email');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      data: donation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Accept a donation
// @route   PUT /api/donations/accept/:id
// @access  Private (NGO only)
const acceptDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Donation is not available for acceptance'
      });
    }

    donation.status = 'accepted';
    donation.acceptedBy = req.user._id;
    donation.acceptedAt = new Date();

    await donation.save();

    // Update NGO stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalPickups: 1, points: 5 }
    });

    // Create notification for donor
    await Notification.create({
      userId: donation.donorId,
      type: 'donation_accepted',
      title: 'Donation Accepted!',
      message: `Your donation "${donation.foodName}" has been accepted by ${req.user.name}`,
      data: {
        donationId: donation._id,
        link: `/donations/${donation._id}`
      },
      priority: 'high'
    });

    const updatedDonation = await Donation.findById(req.params.id)
      .populate('donorId', 'name phone address email')
      .populate('acceptedBy', 'name phone address email');

    // Emit socket event
    req.app.get('io')?.emit('donation_accepted', {
      donationId: donation._id,
      acceptedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Donation accepted successfully',
      data: updatedDonation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update donation status
// @route   PUT /api/donations/status/:id
// @access  Private
const updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Validation based on user role and current status
    if (status === 'completed') {
      // Only NGO who accepted can mark as completed
      if (req.user.role !== 'ngo' || !donation.acceptedBy || donation.acceptedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to complete this donation'
        });
      }
      if (donation.status !== 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'Donation must be accepted before completion'
        });
      }
      donation.completedAt = new Date();
    } else if (status === 'cancelled') {
      // Only donor can cancel their own donation
      if (req.user.role !== 'restaurant' || donation.donorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this donation'
        });
      }
      if (donation.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only pending donations can be cancelled'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    donation.status = status;
    await donation.save();

    const updatedDonation = await Donation.findById(req.params.id)
      .populate('donorId', 'name phone address email')
      .populate('acceptedBy', 'name phone address email');

    res.json({
      success: true,
      message: `Donation ${status} successfully`,
      data: updatedDonation
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete donation
// @route   DELETE /api/donations/:id
// @access  Private (Restaurant only - own donations)
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Only donor can delete their own donation
    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this donation'
      });
    }

    // Can only delete pending donations
    if (donation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending donations can be deleted'
      });
    }

    await Donation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Donation deleted successfully'
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
  createDonation,
  getDonations,
  getMyDonations,
  getDonation,
  acceptDonation,
  updateDonationStatus,
  deleteDonation
};