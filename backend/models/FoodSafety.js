// Food Safety Verification Model
const mongoose = require('mongoose');

const foodSafetySchema = mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  acceptedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Pre-pickup verification (by donor)
  prePickupCheck: {
    temperature: {
      value: Number,
      unit: { type: String, enum: ['C', 'F'], default: 'C' },
      acceptable: Boolean
    },
    packaging: {
      type: String,
      enum: ['sealed', 'covered', 'open'],
      required: true
    },
    contamination: {
      checked: Boolean,
      status: { type: String, enum: ['clean', 'acceptable', 'contaminated'] }
    },
    smell: {
      checked: Boolean,
      status: { type: String, enum: ['fresh', 'acceptable', 'spoiled'] }
    },
    appearance: {
      checked: Boolean,
      status: { type: String, enum: ['good', 'acceptable', 'poor'] }
    },
    photos: [{
      url: String,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }],
    checkedBy: String,
    checkedAt: { type: Date, default: Date.now },
    notes: String
  },
  // Post-pickup verification (by NGO)
  postPickupCheck: {
    temperatureOnArrival: {
      value: Number,
      unit: { type: String, enum: ['C', 'F'], default: 'C' },
      acceptable: Boolean
    },
    packagingIntact: Boolean,
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    quantityMatch: {
      matches: Boolean,
      actualQuantity: String,
      expectedQuantity: String
    },
    freshnessRating: {
      type: Number,
      min: 1,
      max: 5
    },
    photos: [{
      url: String,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }],
    checkedBy: String,
    checkedAt: Date,
    notes: String,
    issuesReported: [{
      issue: String,
      severity: { type: String, enum: ['minor', 'major', 'critical'] },
      description: String
    }]
  },
  // Distribution verification (by NGO)
  distributionCheck: {
    distributedAt: Date,
    location: String,
    beneficiariesCount: Number,
    mealsServed: Number,
    photos: [{
      url: String,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }],
    feedback: String,
    responsiblePerson: String
  },
  // Overall status
  overallStatus: {
    type: String,
    enum: ['passed', 'passed_with_notes', 'failed', 'pending'],
    default: 'pending'
  },
  complianceScore: {
    type: Number,
    min: 0,
    max: 100
  },
  alerts: [{
    type: String,
    severity: { type: String, enum: ['info', 'warning', 'critical'] },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Calculate compliance score
foodSafetySchema.methods.calculateComplianceScore = function() {
  let score = 0;
  let maxScore = 0;

  // Pre-pickup checks (40 points)
  if (this.prePickupCheck) {
    maxScore += 40;
    if (this.prePickupCheck.temperature?.acceptable) score += 10;
    if (this.prePickupCheck.packaging === 'sealed') score += 10;
    else if (this.prePickupCheck.packaging === 'covered') score += 7;
    if (this.prePickupCheck.contamination?.status === 'clean') score += 10;
    if (this.prePickupCheck.smell?.status === 'fresh') score += 5;
    else if (this.prePickupCheck.smell?.status === 'acceptable') score += 3;
    if (this.prePickupCheck.appearance?.status === 'good') score += 5;
  }

  // Post-pickup checks (40 points)
  if (this.postPickupCheck) {
    maxScore += 40;
    if (this.postPickupCheck.temperatureOnArrival?.acceptable) score += 10;
    if (this.postPickupCheck.packagingIntact) score += 10;
    if (this.postPickupCheck.qualityRating) score += this.postPickupCheck.qualityRating * 2;
    if (this.postPickupCheck.quantityMatch?.matches) score += 5;
    if (this.postPickupCheck.freshnessRating) score += this.postPickupCheck.freshnessRating * 2;
    if (this.postPickupCheck.issuesReported?.length === 0) score += 3;
  }

  // Distribution checks (20 points)
  if (this.distributionCheck?.distributedAt) {
    maxScore += 20;
    score += 20;
  }

  this.complianceScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  
  // Determine overall status
  if (this.complianceScore >= 80) {
    this.overallStatus = 'passed';
  } else if (this.complianceScore >= 60) {
    this.overallStatus = 'passed_with_notes';
  } else if (this.complianceScore > 0) {
    this.overallStatus = 'failed';
  }

  return this.save();
};

module.exports = mongoose.model('FoodSafety', foodSafetySchema);
