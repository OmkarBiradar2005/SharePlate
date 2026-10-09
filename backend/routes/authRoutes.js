const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Register validation
const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .matches(/^\d{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  body('role')
    .isIn(['restaurant', 'ngo'])
    .withMessage('Role must be either restaurant or ngo'),
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
];

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// @route   POST /api/auth/register
router.post('/register', registerValidation, registerUser);

// @route   POST /api/auth/login
router.post('/login', loginValidation, loginUser);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;