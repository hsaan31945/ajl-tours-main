/**
 * Tour Controller
 * Handles HTTP requests/responses for tour operations
 */
const tourService = require('../services/tourService');
const { AppError } = require('../middleware/errorHandler');

class TourController {
  /**
   * GET /api/tours - Get all tours
   */
  async getAllTours(req, res, next) {
    try {
      const { division, limit, sort, view, full } = req.query;
      const useList = full !== 'true';

      const tours = useList
        ? await tourService.getToursList({
            division,
            limit: limit || 50,
            sort: sort || 'newest',
            view: view || 'list',
          })
        : await tourService.getAllTours();

      if (useList) {
        res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
      } else {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
      res.json(tours);
    } catch (error) {
      console.error('Error in getAllTours controller:', error);
      next(error);
    }
  }

  /**
   * GET /api/tours/:id - Get tour by ID
   */
  async getTourById(req, res, next) {
    try {
      const { id } = req.params;
      const tour = await tourService.getTourById(id);
      res.setHeader('Cache-Control', 'no-store');
      res.json(tour);
    } catch (error) {
      if (error.message === 'Tour not found') {
        return next(new AppError('Tour not found', 404));
      }
      if (error.message === 'Invalid tour ID format') {
        return next(new AppError('Invalid tour ID format', 400));
      }
      next(error);
    }
  }

  /**
   * GET /api/tours/:id/image - Serve first tour image without embedding it in list JSON
   */
  async getTourImage(req, res, next) {
    try {
      const { id } = req.params;
      const imageIndex = req.query?.index || 0;
      const image = await tourService.getTourImage(id, imageIndex);

      if (image.redirectUrl) {
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
        return res.redirect(302, image.redirectUrl);
      }

      if (image.updatedAt) {
        res.setHeader('Last-Modified', new Date(image.updatedAt).toUTCString());
      }
      res.setHeader('Content-Type', image.contentType);
      res.setHeader('Content-Length', image.buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
      return res.end(image.buffer);
    } catch (error) {
      if (error.message === 'Tour not found' || error.message === 'Tour image not found') {
        return next(new AppError(error.message, 404));
      }
      next(error);
    }
  }

  /**
   * POST /api/tours - Create tour
   */
  async createTour(req, res, next) {
    try {
      console.log('Creating tour with data:', {
        division: req.body.division,
        name: req.body.name,
        price: req.body.price,
        hasStartLocation: !!req.body.startLocation,
        hasEndLocation: !!req.body.endLocation
      });
      
      const tour = await tourService.createTour(req.body);
      
      console.log('Tour created successfully:', tour._id);
      
      res.status(201).json({
        success: true,
        message: 'Tour created successfully',
        tour
      });
    } catch (error) {
      console.error('Error in createTour controller:', error);
      
      // Handle specific error messages
      if (error.message.includes('Division not found')) {
        return next(new AppError('Division not found. Please create a division first.', 404));
      }
      if (error.message.includes('required')) {
        return next(new AppError(error.message, 400));
      }
      if (error.message.includes('Validation error')) {
        return next(new AppError(error.message, 400));
      }
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return next(new AppError(`Validation error: ${errors.join(', ')}`, 400));
      }
      
      next(error);
    }
  }

  /**
   * PUT /api/tours/:id - Update tour
   */
  async updateTour(req, res, next) {
    try {
      const { id } = req.params;
      const tour = await tourService.updateTour(id, req.body);
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        message: 'Tour updated successfully',
        tour
      });
    } catch (error) {
      if (error.message === 'Tour not found') {
        return next(new AppError('Tour not found', 404));
      }
      if (error.message.includes('Division not found')) {
        return next(new AppError('Division not found. Please create a division first.', 404));
      }
      next(error);
    }
  }

  /**
   * POST /api/tours/:id/reviews - Add or update a user review
   */
  async addTourReview(req, res, next) {
    try {
      const { id } = req.params;
      const tour = await tourService.addTourReview(id, req.body);
      res.setHeader('Cache-Control', 'no-store');
      res.status(201).json({
        success: true,
        message: 'Review saved successfully',
        tour
      });
    } catch (error) {
      if (error.message === 'Tour not found') {
        return next(new AppError('Tour not found', 404));
      }
      if (
        error.message.includes('rating') ||
        error.message.includes('Login is required')
      ) {
        return next(new AppError(error.message, 400));
      }
      next(error);
    }
  }

  /**
   * DELETE /api/tours/:id - Delete tour
   */
  async deleteTour(req, res, next) {
    try {
      const { id } = req.params;
      const result = await tourService.deleteTour(id);
      res.json(result);
    } catch (error) {
      if (error.message === 'Tour not found') {
        return next(new AppError('Tour not found', 404));
      }
      next(error);
    }
  }
}

module.exports = new TourController();
