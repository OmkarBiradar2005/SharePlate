const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getAdminDashboard,
  getAllUsers,
  verifyUser,
  deactivateUser,
  getAllDonations,
  sendAnnouncement
} = require('../controllers/adminController');

// All admin routes require admin role
router.get('/dashboard', protect, admin, getAdminDashboard);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/verify', protect, admin, verifyUser);
router.put('/users/:id/deactivate', protect, admin, deactivateUser);
router.get('/donations', protect, admin, getAllDonations);
router.post('/announcement', protect, admin, sendAnnouncement);

module.exports = router;
