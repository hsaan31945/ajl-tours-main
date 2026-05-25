const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getAllBookings, 
  updateBookingStatus, 
  getBookingStats 
} = require('../controllers/bookingController');

// Create new booking (from payment flow)
router.post('/', createBooking);

// Get all bookings (admin only)
router.get('/', getAllBookings);

// Get booking statistics (admin only)
router.get('/stats', getBookingStats);

// Update booking status (admin only)
router.put('/:id/status', updateBookingStatus);

module.exports = router;
