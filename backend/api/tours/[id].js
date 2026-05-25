/**
 * Vercel Serverless Function - Tour by ID
 * Thin wrapper that uses the unified backend structure
 */
const { connectDB } = require('../../src/config/database');
const { setCORSHeaders } = require('../../src/middleware/cors');
const tourController = require('../../src/controllers/tourController');
const { errorHandler } = require('../../src/middleware/errorHandler');

module.exports = async (req, res) => {
  // Set CORS headers first
  setCORSHeaders(req, res);
  
  // Handle OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Connect to database
    await connectDB();
    
    // Extract ID from URL (Vercel dynamic routes)
    const id = req.query.id || req.url.match(/\/tours\/([^\/\?]+)/)?.[1];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tour ID is required'
      });
    }
    
    // Set ID in params for controller
    req.params = { id };
    
    // Handle request
    if (req.method === 'GET') {
      await tourController.getTourById(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res);
        }
      });
    } else if (req.method === 'PUT') {
      await tourController.updateTour(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res);
        }
      });
    } else if (req.method === 'DELETE') {
      await tourController.deleteTour(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res);
        }
      });
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
  } catch (error) {
    errorHandler(error, req, res);
  }
};
