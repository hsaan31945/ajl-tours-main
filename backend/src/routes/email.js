const express = require('express');
const { sendResetOtp } = require('../controllers/emailController');

const router = express.Router();

router.post('/send-reset-otp', sendResetOtp);

module.exports = router;
