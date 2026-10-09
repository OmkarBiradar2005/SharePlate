const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateDonationReport,
  exportToCSV,
  generateTaxCertificate
} = require('../controllers/reportController');

router.get('/donations', protect, generateDonationReport);
router.get('/export-csv', protect, exportToCSV);
router.get('/tax-certificate', protect, generateTaxCertificate);

module.exports = router;
