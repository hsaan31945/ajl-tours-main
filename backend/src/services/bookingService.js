/**
 * Booking Service
 * Business logic for booking operations
 */
const Booking = require('../../models/Booking');
const User = require('../../models/User');
const { normalizeTourId, isValidObjectId } = require('../utils/tourId');
const { getValidatedTourPricing } = require('./bookingPricingService');
const { sendNewBookingAdminAlert } = require('./emailService');

const VALID_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'completed']);

const normalizeBookingStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'not confirmed') return 'cancelled';
  if (!VALID_STATUSES.has(normalized)) {
    const error = new Error('Invalid booking status');
    error.statusCode = 400;
    throw error;
  }
  return normalized;
};

class BookingService {
  /**
   * Get all bookings
   */
  async getAllBookings(filters = {}) {
    const query = {};
    
    if (filters.email) {
      query.email = filters.email;
    }
    
    if (filters.tourId) {
      query.tourId = normalizeTourId(filters.tourId);
    }
    
    return await Booking.find(query)
      .select('-__v')
      .populate('user', 'name email phone createdAt')
      .populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id) {
    const bookingId = normalizeTourId(id);
    
    if (!isValidObjectId(bookingId)) {
      throw new Error('Invalid booking ID format');
    }
    
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone createdAt')
      .populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus')
      .lean();
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking;
  }

  /**
   * Create booking
   */
  async createBooking(bookingData) {
    if (bookingData.stripePaymentId) {
      const existingBooking = await Booking.findOne({ stripePaymentId: bookingData.stripePaymentId })
        .populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus');
      if (existingBooking) {
        return existingBooking.toObject({ virtuals: true });
      }
    }

    if (bookingData.tourId) {
      const pricing = await getValidatedTourPricing({
        tourId: bookingData.tourId,
        tickets: bookingData.tickets ?? bookingData.travelers,
        selectedDate: bookingData.selectedDate || bookingData.tripDate,
        flexibility: bookingData.flexibility,
      });
      const tripDate = bookingData.tripDate || bookingData.selectedDate || new Date();
      bookingData = {
        ...bookingData,
        tourId: pricing.tour._id,
        tourTitle: pricing.tour.name,
        travelers: pricing.tickets,
        totalPrice: pricing.total,
        unitPrice: pricing.pricedUnit,
        originalUnitPrice: pricing.originalUnitPrice,
        discountUnitPrice: pricing.discountUnitPrice,
        groupDiscountTier: pricing.groupDiscountTier,
        groupDiscountUnitAmount: pricing.groupDiscountUnitAmount,
        groupDiscountTotal: pricing.groupDiscountTotal,
        groupDiscountPercent: pricing.groupDiscountPercent,
        paymentCurrency: pricing.currency.toUpperCase(),
        minTicketsAtBooking: pricing.minTickets,
        flexibility: pricing.flexibility,
        tripDate,
      };
    } else {
      throw new Error('Valid tourId is required');
    }
    
    if (!bookingData.user && bookingData.email) {
      const user = await User.findOne({
        email: String(bookingData.email).toLowerCase().trim(),
        isActive: true,
      }).select('_id').lean();
      if (user?._id) {
        bookingData.user = user._id;
      }
    }

    const booking = new Booking(bookingData);
    await booking.save();
    await booking.populate('user', 'name email phone createdAt');
    await booking.populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus');
    const savedBooking = booking.toObject({ virtuals: true });

    try {
      await sendNewBookingAdminAlert({ booking: savedBooking });
    } catch (emailError) {
      console.error('New booking admin alert failed:', emailError.response?.data || emailError.message);
    }

    return savedBooking;
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(id, status) {
    const bookingId = normalizeTourId(id);
    
    if (!isValidObjectId(bookingId)) {
      throw new Error('Invalid booking ID format');
    }
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: normalizeBookingStatus(status) },
      { new: true }
    )
      .populate('user', 'name email phone createdAt')
      .populate('tourId', 'name price discountEnabled discountPrice groupDiscountEnabled groupDiscount4 groupDiscount5 groupDiscount6Plus');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking.toObject({ virtuals: true });
  }

  /**
   * Delete booking
   */
  async deleteBooking(id) {
    const bookingId = normalizeTourId(id);

    if (!isValidObjectId(bookingId)) {
      throw new Error('Invalid booking ID format');
    }

    const booking = await Booking.findByIdAndDelete(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    return { success: true, message: 'Booking deleted successfully' };
  }

  /**
   * Get booking statistics
   */
  async getBookingStats() {
    const [statusCounts, revenue] = await Promise.all([
      Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Booking.aggregate([
        {
          $match: { status: { $in: ['confirmed', 'completed'] } }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: { $ifNull: ['$totalPrice', 0] } }
          }
        }
      ]).then(([value]) => value || {})
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      const key = String(item._id || 'pending').toLowerCase();
      acc[key] = item.count;
      return acc;
    }, {});

    return {
      totalBookings: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
      pendingBookings: byStatus.pending || 0,
      confirmedBookings: byStatus.confirmed || 0,
      cancelledBookings: byStatus.cancelled || 0,
      completedBookings: byStatus.completed || 0,
      totalRevenue: revenue?.totalRevenue || 0,
      byStatus,
    };
  }
}

module.exports = new BookingService();
