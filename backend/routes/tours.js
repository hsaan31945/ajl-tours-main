const express = require('express');
const router = express.Router();
const tourController = require('../src/controllers/tourController');

router.get('/', tourController.getAllTours.bind(tourController));
router.post('/', tourController.createTour.bind(tourController));
router.get('/:id', tourController.getTourById.bind(tourController));
router.put('/:id', async (req, res, next) => {
  try {
    const tourService = require('../src/services/tourService');
    const tour = await tourService.updateTour(req.params.id, req.body);
    res.json(tour);
  } catch (error) {
    next(error);
  }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const tourService = require('../src/services/tourService');
    const result = await tourService.deleteTour(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
