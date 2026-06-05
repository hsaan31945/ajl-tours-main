/**
 * Input Validation Middleware
 * Validates request data before processing
 */

const { AppError } = require('./errorHandler');
const mongoose = require('mongoose');

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    throw new AppError(`${fieldName} is required`, 400);
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
  
  return true;
};

/**
 * Validate tour creation data
 */
const validateTourData = (req, res, next) => {
  try {
    const {
      division,
      name,
      price,
      discountPrice,
      startLocation,
      endLocation,
      startDate,
      endDate
    } = req.body;

    // Required fields
    if (!division) {
      return next(new AppError('Division is required', 400));
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return next(new AppError('Tour name is required and must be a non-empty string', 400));
    }
    
    if (price === undefined || price === null) {
      return next(new AppError('Price is required', 400));
    }
    
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return next(new AppError('Price must be a valid positive number', 400));
    }

    if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
      const discountPriceNum = Number(discountPrice);
      if (isNaN(discountPriceNum) || discountPriceNum < 0) {
        return next(new AppError('Discounted price must be a valid positive number', 400));
      }
    }
    
    if (!startLocation || typeof startLocation !== 'string' || startLocation.trim().length === 0) {
      return next(new AppError('Start location is required', 400));
    }
    
    if (!endLocation || typeof endLocation !== 'string' || endLocation.trim().length === 0) {
      return next(new AppError('End location is required', 400));
    }

    // Validate division ObjectId
    try {
      validateObjectId(division, 'Division');
    } catch (error) {
      return next(new AppError('Invalid division ID format', 400));
    }

    // Validate dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return next(new AppError('Invalid start date format', 400));
      }
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return next(new AppError('Invalid end date format', 400));
      }
      
      // Check if end date is after start date
      if (startDate) {
        const start = new Date(startDate);
        if (end < start) {
          return next(new AppError('End date must be after start date', 400));
        }
      }
    }

    // Validate arrays
    const arrayFields = ['highlights', 'included', 'excluded', 'itinerary', 'images', 'pickupLocations'];
    arrayFields.forEach(field => {
      if (req.body[field] !== undefined && !Array.isArray(req.body[field])) {
        return next(new AppError(`${field} must be an array`, 400));
      }
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate tour update data (less strict than creation)
 */
const validateTourUpdate = (req, res, next) => {
  try {
    const { price, discountPrice, startDate, endDate } = req.body;

    // Validate price if provided
    if (price !== undefined) {
      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return next(new AppError('Price must be a valid positive number', 400));
      }
    }

    if (discountPrice !== undefined && discountPrice !== null && discountPrice !== '') {
      const discountPriceNum = Number(discountPrice);
      if (isNaN(discountPriceNum) || discountPriceNum < 0) {
        return next(new AppError('Discounted price must be a valid positive number', 400));
      }
    }

    // Validate dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return next(new AppError('Invalid start date format', 400));
      }
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return next(new AppError('Invalid end date format', 400));
      }
      
      if (startDate) {
        const start = new Date(startDate);
        if (end < start) {
          return next(new AppError('End date must be after start date', 400));
        }
      }
    }

    // Validate name if provided
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        return next(new AppError('Tour name must be a non-empty string', 400));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateTourData,
  validateTourUpdate,
  validateObjectId
};



