/**
 * Booking Service
 * Business logic for booking operations
 */
const Booking = require('../../models/Booking');
const { normalizeTourId, isValidObjectId } = require('../utils/tourId');
const { getValidatedTourPricing } = require('./bookingPricingService');

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
      .populate('tourId', 'name price')
      .sort({ createdAt: -1 })
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
      .populate('tourId', 'name price')
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
        paymentCurrency: pricing.currency.toUpperCase(),
        minTicketsAtBooking: pricing.minTickets,
        flexibility: pricing.flexibility,
        tripDate,
      };
    } else {
      throw new Error('Valid tourId is required');
    }
    
    const booking = new Booking(bookingData);
    await booking.save();
    await booking.populate('tourId', 'name price');
    return booking.toObject({ virtuals: true });
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
      { status },
      { new: true }
    ).populate('tourId', 'name price');
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking.toObject({ virtuals: true });
  }

  /**
   * Get booking statistics
   */
  async getBookingStats() {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return stats;
  }
}

module.exports = new BookingService();



