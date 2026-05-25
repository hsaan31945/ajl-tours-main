/**
 * Booking Service
 * Business logic for booking operations
 */
const Booking = require('../../models/Booking');
const Tour = require('../../models/Tour');
const { normalizeTourId, isValidObjectId } = require('../utils/tourId');

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
    // Validate tour exists
    if (bookingData.tourId) {
      const tourId = normalizeTourId(bookingData.tourId);
      const tour = await Tour.findById(tourId);
      if (!tour) {
        throw new Error('Tour not found');
      }
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





