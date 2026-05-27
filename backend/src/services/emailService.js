const axios = require('axios');

const RESEND_API_URL = 'https://api.resend.com/emails';

const getResendConfig = () => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'AJL Tours <onboarding@resend.dev>').trim();

  if (!apiKey) {
    const error = new Error('Resend is not configured. Set RESEND_API_KEY in the server environment.');
    error.statusCode = 500;
    throw error;
  }

  return { apiKey, fromEmail };
};

const sendPasswordResetOtp = async ({ toEmail, otp, expiresAt }) => {
  const { apiKey, fromEmail } = getResendConfig();

  const response = await axios.post(
    RESEND_API_URL,
    {
      from: fromEmail,
      to: [toEmail],
      subject: 'Reset Your AJL Tours Password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Reset your AJL Tours password</h2>
          <p>Use the 6-digit code below to reset your password.</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</p>
          <p>This code will expire at ${expiresAt}.</p>
          <p>If you did not request this code, you can safely ignore this email.</p>
          <p>Thanks,<br />AJL Tours</p>
        </div>
      `,
      text: `Use this 6-digit code to reset your AJL Tours password: ${otp}\n\nThis code will expire at ${expiresAt}.\n\nIf you did not request this code, you can safely ignore this email.`,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return response.data;
};

module.exports = {
  sendPasswordResetOtp,
};
