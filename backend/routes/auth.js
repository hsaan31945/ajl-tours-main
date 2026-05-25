const express = require('express');
const router = express.Router();
const { register, login, resetPassword, verifyToken } = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/verify', verifyToken);

module.exports = router;