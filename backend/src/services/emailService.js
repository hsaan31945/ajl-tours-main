const axios = require('axios');

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_SUPPORT_NOTIFICATION_EMAIL = 'hey@ajltour.com';

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

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  const { apiKey, fromEmail } = getResendConfig();
  const payload = {
    from: fromEmail,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  const response = await axios.post(
    RESEND_API_URL,
    payload,
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

const sendPasswordResetOtp = async ({ toEmail, otp, expiresAt }) => (
  sendEmail({
    to: toEmail,
    subject: 'Reset Your AJL Tours Password',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Reset your AJL Tours password</h2>
        <p>Use the 6-digit code below to reset your password.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</p>
        <p>This code will expire at ${escapeHtml(expiresAt)}.</p>
        <p>If you did not request this code, you can safely ignore this email.</p>
        <p>Thanks,<br />AJL Tours</p>
      </div>
    `,
    text: `Use this 6-digit code to reset your AJL Tours password: ${otp}\n\nThis code will expire at ${expiresAt}.\n\nIf you did not request this code, you can safely ignore this email.`,
  })
);

const getSupportNotificationEmail = () => (
  (process.env.SUPPORT_NOTIFICATION_EMAIL || DEFAULT_SUPPORT_NOTIFICATION_EMAIL).trim()
);

const sendSupportTicketNotification = async ({ ticket, booking }) => {
  const toEmail = getSupportNotificationEmail();
  const ticketNumber = ticket.ticketNumber || 'New ticket';
  const customerEmail = ticket.userEmail || '';
  const customerName = ticket.name || 'Customer';
  const customerPhone = ticket.phone || '';
  const category = ticket.category || 'other';
  const priority = ticket.priority || 'normal';
  const subject = ticket.subject || 'Support request';
  const message = ticket.message || '';
  const bookingTitle = booking?.tourTitle || '';
  const bookingId = booking?._id ? String(booking._id) : '';

  return sendEmail({
    to: toEmail,
    replyTo: customerEmail || undefined,
    subject: `[AJL Support] ${ticketNumber}: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">New AJL Tours support ticket</h2>
        <p>A customer submitted a new support ticket from the website dashboard.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 680px;">
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Ticket</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(ticketNumber)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Customer</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(customerName)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(customerEmail)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(customerPhone || 'Not provided')}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Category</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(category)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Priority</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(priority)}</td></tr>
          ${bookingId ? `<tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Booking</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(bookingTitle || bookingId)} (${escapeHtml(bookingId)})</td></tr>` : ''}
        </table>
        <h3 style="margin: 20px 0 8px;">Subject</h3>
        <p>${escapeHtml(subject)}</p>
        <h3 style="margin: 20px 0 8px;">Message</h3>
        <p style="white-space: pre-line;">${escapeHtml(message)}</p>
      </div>
    `,
    text: [
      'New AJL Tours support ticket',
      '',
      `Ticket: ${ticketNumber}`,
      `Customer: ${customerName}`,
      `Email: ${customerEmail}`,
      `Phone: ${customerPhone || 'Not provided'}`,
      `Category: ${category}`,
      `Priority: ${priority}`,
      bookingId ? `Booking: ${bookingTitle || bookingId} (${bookingId})` : '',
      '',
      `Subject: ${subject}`,
      '',
      message,
    ].filter(Boolean).join('\n'),
  });
};

module.exports = {
  sendPasswordResetOtp,
  sendSupportTicketNotification,
};
