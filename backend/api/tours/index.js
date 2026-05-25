/**
 * Vercel Serverless Function - Tours List & Create
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
    
    // Parse body for POST requests
    if (req.method === 'POST' && !req.body) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyStr = Buffer.concat(chunks).toString() || '{}';
      try {
        req.body = JSON.parse(bodyStr);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }
    
    // Handle request
    if (req.method === 'GET') {
      await tourController.getAllTours(req, res, (err) => {
        if (err) {
          errorHandler(err, req, res);
        }
      });
    } else if (req.method === 'POST') {
      await tourController.createTour(req, res, (err) => {
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
