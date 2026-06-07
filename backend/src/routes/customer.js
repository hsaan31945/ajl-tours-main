const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.get('/overview', customerController.getOverview.bind(customerController));

router.get('/bookings', customerController.getBookings.bind(customerController));
router.get('/bookings/:id', customerController.getBookingById.bind(customerController));
router.put('/bookings/:id/cancel', customerController.cancelBooking.bind(customerController));

router.get('/profile', customerController.getProfile.bind(customerController));
router.put('/profile', customerController.updateProfile.bind(customerController));
router.put('/profile/password', customerController.changePassword.bind(customerController));

router.get('/notifications', customerController.getNotifications.bind(customerController));
router.patch('/notifications/read-all', customerController.markAllNotificationsRead.bind(customerController));
router.patch('/notifications/:id/read', customerController.markNotificationRead.bind(customerController));

router.get('/payments', customerController.getPayments.bind(customerController));

router.get('/support-tickets', customerController.getSupportTickets.bind(customerController));
router.post('/support-tickets', customerController.createSupportTicket.bind(customerController));
router.get('/support-tickets/:id', customerController.getSupportTicketById.bind(customerController));

router.get('/wishlist', customerController.getWishlist.bind(customerController));
router.post('/wishlist', customerController.addWishlistItem.bind(customerController));
router.delete('/wishlist/:tourId', customerController.removeWishlistItem.bind(customerController));

router.get('/security', customerController.getSecurity.bind(customerController));

module.exports = router;
