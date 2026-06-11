/**
 * Booking Controller
 */
const bookingService = require('../services/bookingService');
const { AppError } = require('../middleware/errorHandler');

class BookingController {
  async getAllBookings(req, res, next) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      const filters = {
        email: req.query.email,
        tourId: req.query.tourId
      };
      
      const bookings = await bookingService.getAllBookings(filters);
      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      const { id } = req.params;
      const booking = await bookingService.getBookingById(id);
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      if (error.message === 'Booking not found') {
        return next(new AppError('Booking not found', 404));
      }
      next(error);
    }
  }

  async createBooking(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.body);
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking
      });
    } catch (error) {
      if (error.message === 'Tour not found') {
        return next(new AppError('Tour not found', 404));
      }
      if (error.statusCode) {
        return next(new AppError(error.message, error.statusCode));
      }
      next(error);
    }
  }

  async updateBookingStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return next(new AppError('Status is required', 400));
      }
      
      const booking = await bookingService.updateBookingStatus(id, status);
      res.json({
        success: true,
        message: 'Booking status updated',
        data: booking
      });
    } catch (error) {
      if (error.message === 'Booking not found') {
        return next(new AppError('Booking not found', 404));
      }
      next(error);
    }
  }

  async deleteBooking(req, res, next) {
    try {
      const { id } = req.params;
      const result = await bookingService.deleteBooking(id);
      res.json(result);
    } catch (error) {
      if (error.message === 'Booking not found') {
        return next(new AppError('Booking not found', 404));
      }
      next(error);
    }
  }

  async getBookingStats(req, res, next) {
    try {
      const stats = await bookingService.getBookingStats();
      res.json({
        success: true,
        data: stats,
        ...stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingController();


