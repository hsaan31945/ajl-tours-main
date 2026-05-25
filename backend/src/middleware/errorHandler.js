/**
 * Centralized Error Handling Middleware
 * Standardized error responses across the application
 */
const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.url,
    method: req.method
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  // Build error response
  const errorResponse = {
    success: false,
    error: message,
    ...(config.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details
    })
  };
  
  // Add specific error details if available
  if (err.name === 'ValidationError') {
    errorResponse.details = err.errors;
  }
  
  if (err.name === 'CastError') {
    errorResponse.error = 'Invalid ID format';
  }
  
  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler
};





