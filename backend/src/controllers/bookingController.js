/**
 * Booking Controller
 */
const bookingService = require('../services/bookingService');
const { sendBookingStatusUpdateEmail } = require('../services/emailService');
const { AppError } = require('../middleware/errorHandler');

const EMAIL_STATUSES = new Set(['confirmed', 'cancelled']);

class BookingController {
  async getAllBookings(req, res, next) {
    try {
      res.setHeader('Cache-Control', 'no-store');
      const filters = {
        email: req.query.email,
        tourId: req.query.tourId
      };

      if (!filters.email && !filters.tourId) {
        return next(new AppError('An email or tourId filter is required', 400));
      }
      
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
      const normalizedStatus = String(booking.status || status || '').toLowerCase();
      let message = 'Booking status updated';
      let emailNotification = null;

      if (EMAIL_STATUSES.has(normalizedStatus)) {
        const email = String(booking.email || booking.user?.email || '').trim();
        if (!email) {
          message = "Booking status updated. Email isn't provided.";
          emailNotification = {
            sent: false,
            reason: 'email_not_provided',
            message: "Email isn't provided.",
          };
        } else {
          try {
            await sendBookingStatusUpdateEmail({ booking });
            message = `Booking ${normalizedStatus} and email sent.`;
            emailNotification = {
              sent: true,
              to: email,
            };
          } catch (emailError) {
            console.error('Booking status email failed:', emailError.response?.data || emailError.message);
            message = 'Booking status updated, but email could not be sent.';
            emailNotification = {
              sent: false,
              reason: emailError.code || 'send_failed',
              message: emailError.message || 'Email could not be sent.',
            };
          }
        }
      }

      res.json({
        success: true,
        message,
        data: booking,
        emailNotification,
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
