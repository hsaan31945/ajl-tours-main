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

const formatDate = (value) => {
  if (!value) return 'Not selected';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (value, currency = 'CHF') => {
  const amount = Number(value);
  return `${currency}${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
};

const sendBookingStatusUpdateEmail = async ({ booking }) => {
  const status = String(booking?.status || '').toLowerCase();
  const toEmail = String(booking?.email || booking?.user?.email || '').trim().toLowerCase();

  if (!toEmail) {
    const error = new Error("Email isn't provided.");
    error.code = 'EMAIL_NOT_PROVIDED';
    error.statusCode = 400;
    throw error;
  }

  const customerName = booking?.name || booking?.user?.name || 'Guest customer';
  const tourName = booking?.tourTitle || booking?.tourId?.name || 'Tour';
  const bookingId = booking?._id ? String(booking._id) : '';
  const isCancelled = status === 'cancelled';
  const statusLabel = isCancelled ? 'Cancelled' : 'Confirmed';
  const subject = isCancelled
    ? `Your AJL Tours booking has been cancelled`
    : `Your AJL Tours booking is confirmed`;
  const intro = isCancelled
    ? 'Your booking status has been updated to cancelled.'
    : 'Good news, your booking has been confirmed.';

  return sendEmail({
    to: toEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Booking ${escapeHtml(statusLabel)}</h2>
        <p>Hello ${escapeHtml(customerName)},</p>
        <p>${escapeHtml(intro)}</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 680px; margin: 20px 0;">
          ${bookingId ? `<tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Booking ID</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(bookingId)}</td></tr>` : ''}
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Tour</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(tourName)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(statusLabel)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Travel Date</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(formatDate(booking?.tripDate))}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Travelers</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(booking?.travelers || 1)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Total</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(formatMoney(booking?.totalPrice, booking?.paymentCurrency || 'CHF'))}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>Pickup Address</strong></td><td style="padding: 8px; border: 1px solid #e5e7eb;">${escapeHtml(booking?.address || 'Not provided')}</td></tr>
        </table>
        <p>If you have any questions, reply to this email or contact hey@ajltour.com.</p>
        <p>Thanks,<br />AJL Tours</p>
      </div>
    `,
    text: [
      `Booking ${statusLabel}`,
      '',
      `Hello ${customerName},`,
      intro,
      '',
      bookingId ? `Booking ID: ${bookingId}` : '',
      `Tour: ${tourName}`,
      `Status: ${statusLabel}`,
      `Travel Date: ${formatDate(booking?.tripDate)}`,
      `Travelers: ${booking?.travelers || 1}`,
      `Total: ${formatMoney(booking?.totalPrice, booking?.paymentCurrency || 'CHF')}`,
      `Pickup Address: ${booking?.address || 'Not provided'}`,
      '',
      'If you have any questions, reply to this email or contact hey@ajltour.com.',
      '',
      'Thanks,',
      'AJL Tours',
    ].filter(Boolean).join('\n'),
  });
};

module.exports = {
  sendPasswordResetOtp,
  sendBookingStatusUpdateEmail,
  sendSupportTicketNotification,
};
