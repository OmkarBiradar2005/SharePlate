// Tax Documentation Controller
const TaxDocument = require('../models/TaxDocument');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Generate tax certificate
// @route   POST /api/tax/generate
// @access  Private
const generateTaxCertificate = async (req, res) => {
  try {
    const { year, quarter } = req.body;
    const userId = req.user._id;

    // Generate summary
    const summary = await TaxDocument.generateAnnualSummary(userId, year);

    // Get user details
    const user = await User.findById(userId);

    // Create tax document
    const taxDoc = await TaxDocument.create({
      userId,
      year,
      quarter,
      documentType: quarter ? 'quarterly_report' : 'annual_report',
      donations: summary.donations,
      totalValue: summary.totalValue,
      totalDonations: summary.totalDonations,
      totalMealsServed: summary.totalMealsServed,
      status: 'issued',
      recipientDetails: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tax certificate generated successfully',
      data: taxDoc
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user's tax documents
// @route   GET /api/tax/documents
// @access  Private
const getTaxDocuments = async (req, res) => {
  try {
    const documents = await TaxDocument.find({ userId: req.user._id })
      .sort({ year: -1, createdAt: -1 });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Download tax certificate PDF
// @route   GET /api/tax/download/:id
// @access  Private
const downloadTaxCertificate = async (req, res) => {
  try {
    const taxDoc = await TaxDocument.findById(req.params.id)
      .populate('userId', 'name email phone address');

    if (!taxDoc) {
      return res.status(404).json({
        success: false,
        message: 'Tax document not found'
      });
    }

    // Verify user owns this document
    if (taxDoc.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tax-certificate-${taxDoc.certificateNumber}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SharePlate', { align: 'center' });
    doc.fontSize(16).text('Tax Deduction Certificate', { align: 'center' });
    doc.moveDown();

    // Certificate details
    doc.fontSize(12).text(`Certificate Number: ${taxDoc.certificateNumber}`);
    doc.text(`Issue Date: ${taxDoc.issuedDate.toLocaleDateString()}`);
    doc.text(`Financial Year: ${taxDoc.year}-${taxDoc.year + 1}`);
    doc.moveDown();

    // Recipient details
    doc.fontSize(14).text('Donor Details:', { underline: true });
    doc.fontSize(12).text(`Name: ${taxDoc.recipientDetails.name || taxDoc.userId.name}`);
    doc.text(`Email: ${taxDoc.recipientDetails.email || taxDoc.userId.email}`);
    doc.text(`Phone: ${taxDoc.recipientDetails.phone || taxDoc.userId.phone}`);
    doc.text(`Address: ${taxDoc.recipientDetails.address || taxDoc.userId.address}`);
    doc.moveDown();

    // Donation summary
    doc.fontSize(14).text('Donation Summary:', { underline: true });
    doc.fontSize(12).text(`Total Donations: ${taxDoc.totalDonations}`);
    doc.text(`Total Meals Served: ${taxDoc.totalMealsServed}`);
    doc.text(`Estimated Value: ₹${taxDoc.totalValue.toLocaleString()}`);
    doc.moveDown();

    // Impact statement
    doc.fontSize(14).text('Social Impact:', { underline: true });
    doc.fontSize(12).text(`Your generous food donations have helped serve ${taxDoc.totalMealsServed} meals to those in need.`);
    doc.text(`This represents an estimated social contribution of ₹${taxDoc.totalValue.toLocaleString()}.`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(10).text('This certificate is auto-generated and does not require a signature.', { align: 'center', italics: true });
    doc.text('For queries, contact: support@shareplate.org', { align: 'center' });

    doc.end();

    // Update status
    taxDoc.status = 'downloaded';
    await taxDoc.save();

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  generateTaxCertificate,
  getTaxDocuments,
  downloadTaxCertificate
};
