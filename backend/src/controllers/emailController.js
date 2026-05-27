const { sendPasswordResetOtp } = require('../services/emailService');
const User = require('../../models/User');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const sendResetOtp = async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();
    const expiresAt = String(req.body?.expiresAt || '').trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, error: 'A valid 6-digit reset code is required.' });
    }

    const user = await User.findOne({ email, isActive: true }).select('_id').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account with this email doesn't exist.",
      });
    }

    await sendPasswordResetOtp({ toEmail: email, otp, expiresAt });

    return res.status(200).json({ success: true, message: 'Reset code sent successfully.' });
  } catch (error) {
    console.error('Resend reset OTP error:', error.response?.data || error.message);
    const status = error.statusCode || error.response?.status || 500;
    const message =
      status === 500
        ? 'Failed to send reset code. Email service is not configured.'
        : error.response?.data?.message || error.message || 'Failed to send reset code.';

    if (next) {
      error.statusCode = status;
      error.message = message;
      return next(error);
    }

    return res.status(status).json({ success: false, error: message });
  }
};

module.exports = {
  sendResetOtp,
};
