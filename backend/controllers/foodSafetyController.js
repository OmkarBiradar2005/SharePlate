// Food Safety Controller
const FoodSafety = require('../models/FoodSafety');
const Donation = require('../models/Donation');

// @desc    Create food safety checklist
// @route   POST /api/food-safety/create
// @access  Private
const createFoodSafetyCheck = async (req, res) => {
  try {
    const { donationId, prePickupCheck } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Verify user is the donor
    if (donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const safetyCheck = await FoodSafety.create({
      donationId,
      donorId: req.user._id,
      prePickupCheck
    });

    await safetyCheck.calculateComplianceScore();

    res.status(201).json({
      success: true,
      message: 'Food safety checklist created',
      data: safetyCheck
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update post-pickup check
// @route   PUT /api/food-safety/post-pickup/:id
// @access  Private (NGO only)
const updatePostPickupCheck = async (req, res) => {
  try {
    const { postPickupCheck } = req.body;

    const safetyCheck = await FoodSafety.findById(req.params.id);
    if (!safetyCheck) {
      return res.status(404).json({
        success: false,
        message: 'Safety check not found'
      });
    }

    safetyCheck.postPickupCheck = postPickupCheck;
    safetyCheck.acceptedById = req.user._id;
    
    await safetyCheck.calculateComplianceScore();

    res.json({
      success: true,
      message: 'Post-pickup check updated',
      data: safetyCheck
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update distribution check
// @route   PUT /api/food-safety/distribution/:id
// @access  Private (NGO only)
const updateDistributionCheck = async (req, res) => {
  try {
    const { distributionCheck } = req.body;

    const safetyCheck = await FoodSafety.findById(req.params.id);
    if (!safetyCheck) {
      return res.status(404).json({
        success: false,
        message: 'Safety check not found'
      });
    }

    safetyCheck.distributionCheck = distributionCheck;
    await safetyCheck.calculateComplianceScore();

    res.json({
      success: true,
      message: 'Distribution check updated',
      data: safetyCheck
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get safety check for donation
// @route   GET /api/food-safety/donation/:donationId
// @access  Private
const getSafetyCheckByDonation = async (req, res) => {
  try {
    const safetyCheck = await FoodSafety.findOne({ 
      donationId: req.params.donationId 
    }).populate('donorId acceptedById', 'name email');

    res.json({
      success: true,
      data: safetyCheck
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
  createFoodSafetyCheck,
  updatePostPickupCheck,
  updateDistributionCheck,
  getSafetyCheckByDonation
};
