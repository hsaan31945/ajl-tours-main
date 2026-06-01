/**
 * Tour Routes
 * API endpoints for tour operations
 */
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { corsMiddleware } = require('../middleware/cors');

// Apply CORS to all routes
router.use(corsMiddleware);

// Routes
router.get('/', tourController.getAllTours.bind(tourController));
router.post('/:id/reviews', tourController.addTourReview.bind(tourController));
router.get('/:id', tourController.getTourById.bind(tourController));
router.post('/', tourController.createTour.bind(tourController));
router.put('/:id', tourController.updateTour.bind(tourController));
router.delete('/:id', tourController.deleteTour.bind(tourController));

module.exports = router;




