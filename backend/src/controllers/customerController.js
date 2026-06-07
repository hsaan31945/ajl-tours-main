const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Notification = require('../../models/Notification');
const SupportTicket = require('../../models/SupportTicket');
const Tour = require('../../models/Tour');
const User = require('../../models/User');
const WishlistItem = require('../../models/WishlistItem');
const { AppError } = require('../middleware/errorHandler');
const { getPasswordPolicyMessage } = require('../utils/passwordPolicy');

const CUSTOMER_TOUR_SELECT = [
  'name',
  'price',
  'discountEnabled',
  'discountPrice',
  'groupDiscountEnabled',
  'groupDiscount4',
  'groupDiscount5',
  'groupDiscount6Plus',
  'currency',
  'images',
  'startLocation',
  'endLocation',
  'routeDetails',
  'metadata',
  'division'
].join(' ');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const resolveCustomerEmail = (req) => {
  const email = normalizeEmail(req.query?.email || req.body?.email || req.headers?.['x-customer-email']);
  if (!isValidEmail(email)) {
    throw new AppError('A valid customer email is required', 400);
  }
  return email;
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const data = user.toObject ? user.toObject() : user;
  return {
    id: data._id?.toString?.() || data.id,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    country: data.country || '',
    defaultPickupAddress: data.defaultPickupAddress || '',
    profileImage: data.profileImage || '',
    role: data.role || 'user',
    isActive: data.isActive !== false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    passwordChangedAt: data.passwordChangedAt,
    lastLoginAt: data.lastLoginAt,
    loginActivity: Array.isArray(data.loginActivity)
      ? data.loginActivity.slice(-10).reverse().map((item) => ({
          occurredAt: item.occurredAt,
          userAgent: item.userAgent || ''
        }))
      : []
  };
};

const getSort = (sort) => {
  switch (String(sort || 'newest')) {
    case 'oldest':
      return { createdAt: 1 };
    case 'travelDateAsc':
      return { tripDate: 1 };
    case 'travelDateDesc':
      return { tripDate: -1 };
    case 'amountHigh':
      return { totalPrice: -1 };
    case 'amountLow':
      return { totalPrice: 1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

const buildBookingQuery = ({ email, q, status, paymentStatus }) => {
  const query = { email };
  const statusValue = String(status || '').trim().toLowerCase();
  const paymentValue = String(paymentStatus || '').trim().toLowerCase();

  if (statusValue && statusValue !== 'all') {
    query.status = statusValue;
  }

  if (paymentValue && paymentValue !== 'all') {
    query.paymentStatus = paymentValue;
  }

  const searchValue = String(q || '').trim();
  if (searchValue) {
    const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { tourTitle: regex },
      { stripePaymentId: regex },
      { address: regex }
    ];
  }

  return query;
};

const getCustomerBookings = async (email, options = {}) => {
  const query = buildBookingQuery({ email, ...options });
  return Booking.find(query)
    .populate('tourId', CUSTOMER_TOUR_SELECT)
    .sort(getSort(options.sort))
    .lean();
};

const upsertNotification = async ({ userEmail, type, title, message, sourceKey, relatedBooking, relatedTour, metadata }) => {
  const payload = {
    userEmail,
    type,
    title,
    message,
    relatedBooking,
    relatedTour,
    metadata: metadata || {}
  };

  if (!sourceKey) {
    return Notification.create(payload);
  }

  try {
    await Notification.updateOne(
      { userEmail, sourceKey },
      { $setOnInsert: { ...payload, sourceKey } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

const syncBookingNotifications = async (email, bookings) => {
  const jobs = [];

  bookings.forEach((booking) => {
    const bookingId = booking._id?.toString?.() || String(booking._id || '');
    if (!bookingId) return;

    const tourTitle = booking.tourTitle || booking.tourId?.name || 'your tour';
    jobs.push(upsertNotification({
      userEmail: email,
      type: 'booking_confirmation',
      title: booking.status === 'confirmed' ? 'Booking confirmed' : 'Booking received',
      message: `Your booking for ${tourTitle} is ${booking.status || 'pending'}.`,
      sourceKey: `booking:${bookingId}:status:${booking.status || 'pending'}`,
      relatedBooking: booking._id,
      relatedTour: booking.tourId?._id || booking.tourId,
      metadata: { status: booking.status }
    }));

    if (['paid', 'failed', 'refunded'].includes(String(booking.paymentStatus || '').toLowerCase())) {
      jobs.push(upsertNotification({
        userEmail: email,
        type: 'payment_update',
        title: `Payment ${booking.paymentStatus}`,
        message: `Payment for ${tourTitle} is marked as ${booking.paymentStatus}.`,
        sourceKey: `booking:${bookingId}:payment:${booking.paymentStatus}`,
        relatedBooking: booking._id,
        relatedTour: booking.tourId?._id || booking.tourId,
        metadata: { paymentStatus: booking.paymentStatus }
      }));
    }

    if (booking.status === 'cancelled') {
      jobs.push(upsertNotification({
        userEmail: email,
        type: 'booking_cancellation',
        title: 'Booking cancelled',
        message: `Your booking for ${tourTitle} has been cancelled.`,
        sourceKey: `booking:${bookingId}:cancelled`,
        relatedBooking: booking._id,
        relatedTour: booking.tourId?._id || booking.tourId,
        metadata: { cancelledAt: booking.cancelledAt }
      }));
    }
  });

  await Promise.all(jobs);
};

const getPublicWishlistItem = (item) => {
  const tour = item.tour || {};
  return {
    id: item._id?.toString?.() || item.id,
    savedAt: item.savedAt || item.createdAt,
    notes: item.notes || '',
    tour: {
      id: tour._id?.toString?.() || tour.id || tour,
      _id: tour._id?.toString?.() || tour.id || tour,
      name: tour.name || '',
      description: tour.description || '',
      price: tour.price,
      currency: tour.currency || 'CHF',
      images: tour.images || [],
      startLocation: tour.startLocation || '',
      endLocation: tour.endLocation || '',
      metadata: tour.metadata || {}
    }
  };
};

class CustomerController {
  async getOverview(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const [user, bookings] = await Promise.all([
        User.findOne({ email }).lean(),
        getCustomerBookings(email)
      ]);

      await syncBookingNotifications(email, bookings);

      const now = new Date();
      const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
      const upcomingBookings = activeBookings
        .filter((booking) => booking.tripDate && new Date(booking.tripDate) >= now && booking.status !== 'completed')
        .slice(0, 5);
      const recentBookings = bookings.slice(0, 5);
      const pendingPayments = bookings.filter((booking) => ['pending', 'failed'].includes(booking.paymentStatus));
      const totalSpent = bookings
        .filter((booking) => booking.paymentStatus === 'paid' && booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

      const [notifications, unreadNotifications, supportTickets, wishlistCount] = await Promise.all([
        Notification.find({ userEmail: email }).sort({ createdAt: -1 }).limit(6).lean(),
        Notification.countDocuments({ userEmail: email, isRead: false }),
        SupportTicket.find({ userEmail: email }).sort({ createdAt: -1 }).limit(5).lean(),
        WishlistItem.countDocuments({ userEmail: email })
      ]);

      res.json({
        success: true,
        data: {
          account: {
            status: user?.isActive === false ? 'Inactive' : 'Active',
            memberSince: user?.createdAt || null,
            profile: sanitizeUser(user)
          },
          stats: {
            totalBookings: bookings.length,
            totalSpent,
            pendingPayments: pendingPayments.length,
            upcomingBookings: upcomingBookings.length,
            wishlistCount,
            unreadNotifications
          },
          upcomingBookings,
          recentBookings,
          pendingPayments: pendingPayments.slice(0, 5),
          recentNotifications: notifications,
          recentSupportTickets: supportTickets
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookings(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const bookings = await getCustomerBookings(email, req.query || {});
      res.json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const { id } = req.params;
      if (!isObjectId(id)) throw new AppError('Invalid booking ID format', 400);

      const booking = await Booking.findOne({ _id: id, email })
        .populate('tourId', CUSTOMER_TOUR_SELECT)
        .lean();

      if (!booking) throw new AppError('Booking not found', 404);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const { id } = req.params;
      if (!isObjectId(id)) throw new AppError('Invalid booking ID format', 400);

      const booking = await Booking.findOne({ _id: id, email });
      if (!booking) throw new AppError('Booking not found', 404);
      if (booking.status === 'cancelled') throw new AppError('Booking is already cancelled', 400);
      if (booking.status === 'completed') throw new AppError('Completed bookings cannot be cancelled from the dashboard', 400);
      if (booking.tripDate && new Date(booking.tripDate) <= new Date()) {
        throw new AppError('Past or in-progress bookings cannot be cancelled from the dashboard', 400);
      }

      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      booking.cancelledBy = 'customer';
      booking.cancellationReason = String(req.body?.reason || '').trim().slice(0, 500);
      await booking.save();

      await upsertNotification({
        userEmail: email,
        type: 'booking_cancellation',
        title: 'Booking cancelled',
        message: `Your booking for ${booking.tourTitle} has been cancelled.`,
        sourceKey: `booking:${booking._id}:cancelled`,
        relatedBooking: booking._id,
        relatedTour: booking.tourId,
        metadata: { cancelledAt: booking.cancelledAt, paymentStatus: booking.paymentStatus }
      });

      await booking.populate('tourId', CUSTOMER_TOUR_SELECT);
      res.json({
        success: true,
        message: booking.paymentStatus === 'paid'
          ? 'Booking cancelled. Refunds are reviewed by the AJL Tours support team.'
          : 'Booking cancelled successfully.',
        data: booking.toObject({ virtuals: true })
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const user = await User.findOne({ email }).lean();
      if (!user) throw new AppError('User profile not found', 404);
      res.json({ success: true, data: sanitizeUser(user) });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const updates = {};
      ['name', 'phone', 'country', 'defaultPickupAddress', 'profileImage'].forEach((field) => {
        if (req.body?.[field] !== undefined) {
          updates[field] = String(req.body[field] || '').trim();
        }
      });

      if (updates.name !== undefined && updates.name.length < 2) {
        throw new AppError('Name must be at least 2 characters', 400);
      }

      if (updates.profileImage && updates.profileImage.length > 2_500_000) {
        throw new AppError('Profile image is too large. Please choose an image under 2 MB.', 400);
      }

      const user = await User.findOneAndUpdate(
        { email, isActive: true },
        { $set: updates },
        { new: true, runValidators: true }
      ).lean();

      if (!user) throw new AppError('User profile not found', 404);
      res.json({ success: true, message: 'Profile updated successfully', data: sanitizeUser(user) });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const currentPassword = String(req.body?.currentPassword || '');
      const newPassword = String(req.body?.newPassword || '');

      if (!currentPassword || !newPassword) {
        throw new AppError('Current password and new password are required', 400);
      }

      const passwordMessage = getPasswordPolicyMessage(newPassword);
      if (passwordMessage) throw new AppError(passwordMessage, 400);

      const user = await User.findOne({ email, isActive: true });
      if (!user) throw new AppError('User profile not found', 404);

      const valid = await user.comparePassword(currentPassword);
      if (!valid) throw new AppError('Current password is incorrect', 401);

      user.password = newPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      await upsertNotification({
        userEmail: email,
        type: 'account',
        title: 'Password changed',
        message: 'Your AJL Tours account password was changed.',
        sourceKey: `account:${user._id}:password:${user.passwordChangedAt.getTime()}`
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const notifications = await Notification.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
      next(error);
    }
  }

  async markNotificationRead(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const { id } = req.params;
      if (!isObjectId(id)) throw new AppError('Invalid notification ID format', 400);
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userEmail: email },
        { $set: { isRead: true, readAt: new Date() } },
        { new: true }
      ).lean();
      if (!notification) throw new AppError('Notification not found', 404);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllNotificationsRead(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      await Notification.updateMany(
        { userEmail: email, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async getPayments(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const bookings = await getCustomerBookings(email, { sort: req.query?.sort || 'newest' });
      const payments = bookings.map((booking) => ({
        id: booking._id,
        bookingId: booking._id,
        tourTitle: booking.tourTitle,
        amount: Number(booking.totalPrice || 0),
        currency: booking.paymentCurrency || booking.tourId?.currency || 'CHF',
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.status,
        stripePaymentId: booking.stripePaymentId || '',
        paidAt: booking.paymentStatus === 'paid' ? booking.updatedAt : null,
        invoiceNumber: `AJL-${String(booking._id).slice(-8).toUpperCase()}`,
        refundStatus: booking.paymentStatus === 'refunded'
          ? 'Refunded'
          : booking.status === 'cancelled' && booking.paymentStatus === 'paid'
            ? 'Refund review required'
            : 'No refund activity'
      }));

      res.json({
        success: true,
        data: {
          payments,
          summary: {
            paid: payments.filter((payment) => payment.paymentStatus === 'paid').length,
            pending: payments.filter((payment) => payment.paymentStatus === 'pending').length,
            refunded: payments.filter((payment) => payment.paymentStatus === 'refunded').length,
            totalPaid: payments
              .filter((payment) => payment.paymentStatus === 'paid' && payment.bookingStatus !== 'cancelled')
              .reduce((sum, payment) => sum + payment.amount, 0)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSupportTickets(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const tickets = await SupportTicket.find({ userEmail: email }).sort({ createdAt: -1 }).lean();
      res.json({ success: true, count: tickets.length, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  async getSupportTicketById(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const { id } = req.params;
      const query = isObjectId(id) ? { _id: id, userEmail: email } : { ticketNumber: id, userEmail: email };
      const ticket = await SupportTicket.findOne(query).lean();
      if (!ticket) throw new AppError('Support ticket not found', 404);
      res.json({ success: true, data: ticket });
    } catch (error) {
      next(error);
    }
  }

  async createSupportTicket(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const subject = String(req.body?.subject || '').trim();
      const message = String(req.body?.message || '').trim();
      const category = String(req.body?.category || 'other').trim();
      const bookingId = String(req.body?.bookingId || '').trim();

      if (!subject || !message) {
        throw new AppError('Subject and message are required', 400);
      }

      let booking = null;
      if (bookingId) {
        if (!isObjectId(bookingId)) throw new AppError('Invalid booking ID format', 400);
        booking = await Booking.findOne({ _id: bookingId, email }).select('_id tourTitle').lean();
        if (!booking) throw new AppError('Booking not found for this account', 404);
      }

      const user = await User.findOne({ email }).select('name phone').lean();
      const ticket = await SupportTicket.create({
        userEmail: email,
        name: user?.name || req.body?.name || '',
        phone: user?.phone || req.body?.phone || '',
        subject,
        category,
        message,
        booking: booking?._id,
        priority: req.body?.priority || 'normal'
      });

      await upsertNotification({
        userEmail: email,
        type: 'support',
        title: 'Support ticket created',
        message: `Your support ticket ${ticket.ticketNumber} has been created.`,
        sourceKey: `support:${ticket._id}:created`,
        metadata: { ticketNumber: ticket.ticketNumber }
      });

      res.status(201).json({ success: true, message: 'Support ticket created', data: ticket });
    } catch (error) {
      next(error);
    }
  }

  async getWishlist(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const wishlist = await WishlistItem.find({ userEmail: email })
        .populate('tour', CUSTOMER_TOUR_SELECT)
        .sort({ savedAt: -1 })
        .lean();
      res.json({ success: true, count: wishlist.length, data: wishlist.map(getPublicWishlistItem) });
    } catch (error) {
      next(error);
    }
  }

  async addWishlistItem(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const tourId = String(req.body?.tourId || '').trim();
      if (!isObjectId(tourId)) throw new AppError('Valid tour ID is required', 400);

      const tour = await Tour.findOne({ _id: tourId, isActive: true }).select('_id').lean();
      if (!tour) throw new AppError('Tour not found', 404);

      await WishlistItem.findOneAndUpdate(
        { userEmail: email, tour: tourId },
        { $setOnInsert: { userEmail: email, tour: tourId, notes: req.body?.notes || '', savedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const item = await WishlistItem.findOne({ userEmail: email, tour: tourId })
        .populate('tour', CUSTOMER_TOUR_SELECT)
        .lean();
      res.status(201).json({ success: true, message: 'Tour saved to wishlist', data: getPublicWishlistItem(item) });
    } catch (error) {
      next(error);
    }
  }

  async removeWishlistItem(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const { tourId } = req.params;
      if (!isObjectId(tourId)) throw new AppError('Invalid tour ID format', 400);
      await WishlistItem.deleteOne({ userEmail: email, tour: tourId });
      res.json({ success: true, message: 'Tour removed from wishlist' });
    } catch (error) {
      next(error);
    }
  }

  async getSecurity(req, res, next) {
    try {
      const email = resolveCustomerEmail(req);
      const user = await User.findOne({ email }).lean();
      if (!user) throw new AppError('User profile not found', 404);
      res.json({
        success: true,
        data: {
          accountStatus: user.isActive === false ? 'Inactive' : 'Active',
          passwordChangedAt: user.passwordChangedAt || null,
          lastLoginAt: user.lastLoginAt || null,
          loginActivity: sanitizeUser(user).loginActivity
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
