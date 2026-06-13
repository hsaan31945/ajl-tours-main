const express = require('express');
const router = express.Router();
const adminDataController = require('../controllers/adminDataController');
const bookingController = require('../controllers/bookingController');
const { authenticateAdmin } = require('../middleware/auth');

router.use(authenticateAdmin);

router.get('/summary', adminDataController.getDashboardSummary);
router.get('/bookings', adminDataController.listAdminBookings);
router.get('/bookings/stats', adminDataController.getAdminBookingStats);
router.put('/bookings/:id/status', bookingController.updateBookingStatus.bind(bookingController));
router.delete('/bookings/:id', bookingController.deleteBooking.bind(bookingController));

router.get('/users', adminDataController.listUsers);
router.post('/users', adminDataController.addUser);
router.get('/users/:id', adminDataController.getUserDetails);
router.delete('/users/:id', adminDataController.deleteUser);

router.get('/divisions', adminDataController.listDivisions);
router.post('/divisions', adminDataController.saveDivision);
router.put('/divisions/:id', adminDataController.saveDivision);
router.delete('/divisions/:id', adminDataController.deleteDivision);

router.get('/settings', adminDataController.getSettings);
router.put('/settings', adminDataController.updateSettings);

module.exports = router;
