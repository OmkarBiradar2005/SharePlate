// Tax Documentation Model for Charitable Donations
const mongoose = require('mongoose');

const taxDocumentSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  quarter: {
    type: Number,
    min: 1,
    max: 4
  },
  documentType: {
    type: String,
    enum: ['80G_certificate', 'annual_report', 'quarterly_report', 'donation_receipt'],
    default: 'donation_receipt'
  },
  donations: [{
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    date: Date,
    description: String,
    estimatedValue: Number,
    mealsServed: Number
  }],
  totalValue: {
    type: Number,
    default: 0
  },
  totalDonations: {
    type: Number,
    default: 0
  },
  totalMealsServed: {
    type: Number,
    default: 0
  },
  certificateNumber: {
    type: String,
    unique: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'sent', 'downloaded'],
    default: 'draft'
  },
  recipientDetails: {
    name: String,
    email: String,
    phone: String,
    address: String,
    panNumber: String,
    gstNumber: String
  },
  ngoDetails: {
    name: String,
    registrationNumber: String,
    pan: String,
    address: String,
    authorized80G: {
      type: Boolean,
      default: false
    },
    certificateNumber80G: String
  }
}, {
  timestamps: true
});

// Generate certificate number
taxDocumentSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const year = this.year || new Date().getFullYear();
    const count = await this.constructor.countDocuments({ year });
    this.certificateNumber = `SP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Generate annual summary
taxDocumentSchema.statics.generateAnnualSummary = async function(userId, year) {
  const Donation = require('./Donation');
  const Impact = require('./Impact');
  
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  // Get all donations for the year
  const donations = await Donation.find({
    donorId: userId,
    status: 'completed',
    completedAt: { $gte: startDate, $lte: endDate }
  });

  // Get impact data
  const impacts = await Impact.find({
    userId: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const totalMeals = impacts.reduce((sum, imp) => sum + imp.mealsServed, 0);
  
  // Estimated value: Average meal cost = ₹50
  const totalValue = totalMeals * 50;

  return {
    donations: donations.map(d => ({
      donationId: d._id,
      date: d.completedAt,
      description: d.foodName,
      estimatedValue: d.estimatedMeals * 50,
      mealsServed: d.estimatedMeals
    })),
    totalValue,
    totalDonations: donations.length,
    totalMealsServed: totalMeals
  };
};

module.exports = mongoose.model('TaxDocument', taxDocumentSchema);
