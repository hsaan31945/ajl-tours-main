/**
 * Route Aggregator
 * Central place to register all routes
 */
const express = require('express');
const router = express.Router();

const tourRoutes = require('./tours');
const bookingRoutes = require('./bookings');
const authRoutes = require('./auth');
const emailRoutes = require('./email');
const customerRoutes = require('./customer');

// Register all routes
router.use('/tours', tourRoutes);
router.use('/bookings', bookingRoutes);
router.use('/auth', authRoutes);
router.use('/auth', emailRoutes);
router.use('/customer', customerRoutes);

module.exports = router;



