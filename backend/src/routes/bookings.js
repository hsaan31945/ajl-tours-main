/**
 * Booking Routes
 */
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { corsMiddleware } = require('../middleware/cors');

router.use(corsMiddleware);

router.get('/', bookingController.getAllBookings.bind(bookingController));
router.get('/stats/summary', bookingController.getBookingStats.bind(bookingController));
router.get('/stats', bookingController.getBookingStats.bind(bookingController));
router.post('/', bookingController.createBooking.bind(bookingController));
router.put('/:id/status', bookingController.updateBookingStatus.bind(bookingController));
router.delete('/:id', bookingController.deleteBooking.bind(bookingController));
router.get('/:id', bookingController.getBookingById.bind(bookingController));

module.exports = router;




