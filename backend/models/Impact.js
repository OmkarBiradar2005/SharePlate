// Impact Tracking Model
const mongoose = require('mongoose');

const impactSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  mealsServed: {
    type: Number,
    default: 0,
    required: true
  },
  beneficiaries: {
    type: Number,
    default: 0
  },
  co2Saved: {
    type: Number,
    default: 0,
    comment: 'CO2 emissions saved in kg'
  },
  waterSaved: {
    type: Number,
    default: 0,
    comment: 'Water saved in liters'
  },
  foodWeightKg: {
    type: Number,
    default: 0
  },
  testimonial: {
    message: String,
    author: String,
    rating: Number,
    photos: [String],
    videoUrl: String,
    createdAt: { type: Date, default: Date.now }
  },
  verificationPhoto: {
    url: String,
    timestamp: Date
  },
  distributionDetails: {
    location: String,
    date: Date,
    responsiblePerson: String,
    contactNumber: String
  }
}, {
  timestamps: true
});

// Calculate environmental impact
impactSchema.methods.calculateEnvironmentalImpact = function() {
  // Average calculations:
  // 1 kg food = 2.5 kg CO2
  // 1 kg food = 1000 liters water
  this.co2Saved = this.foodWeightKg * 2.5;
  this.waterSaved = this.foodWeightKg * 1000;
  return this.save();
};

// Static method to get aggregate impact for a user
impactSchema.statics.getUserTotalImpact = async function(userId) {
  const result = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalMeals: { $sum: '$mealsServed' },
        totalBeneficiaries: { $sum: '$beneficiaries' },
        totalCO2Saved: { $sum: '$co2Saved' },
        totalWaterSaved: { $sum: '$waterSaved' },
        totalFoodKg: { $sum: '$foodWeightKg' },
        donationsCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || {
    totalMeals: 0,
    totalBeneficiaries: 0,
    totalCO2Saved: 0,
    totalWaterSaved: 0,
    totalFoodKg: 0,
    donationsCount: 0
  };
};

// Static method to get platform-wide impact
impactSchema.statics.getPlatformImpact = async function() {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalMeals: { $sum: '$mealsServed' },
        totalBeneficiaries: { $sum: '$beneficiaries' },
        totalCO2Saved: { $sum: '$co2Saved' },
        totalWaterSaved: { $sum: '$waterSaved' },
        totalFoodKg: { $sum: '$foodWeightKg' },
        donationsCount: { $sum: 1 }
      }
    }
  ]);

  return result[0] || {
    totalMeals: 0,
    totalBeneficiaries: 0,
    totalCO2Saved: 0,
    totalWaterSaved: 0,
    totalFoodKg: 0,
    donationsCount: 0
  };
};

module.exports = mongoose.model('Impact', impactSchema);
