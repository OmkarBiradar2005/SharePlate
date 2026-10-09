// Tax Documentation Routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateTaxCertificate,
  getTaxDocuments,
  downloadTaxCertificate
} = require('../controllers/taxController');

router.post('/generate', protect, generateTaxCertificate);
router.get('/documents', protect, getTaxDocuments);
router.get('/download/:id', protect, downloadTaxCertificate);

module.exports = router;
