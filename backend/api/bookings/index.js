/**
 * Vercel Serverless Function - Bookings
 */
const { connectDB } = require('../../src/config/database');
const { setCORSHeaders } = require('../../src/middleware/cors');
const bookingController = require('../../src/controllers/bookingController');
const { errorHandler } = require('../../src/middleware/errorHandler');

module.exports = async (req, res) => {
  setCORSHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // Parse body for POST/PUT
    if ((req.method === 'POST' || req.method === 'PUT') && !req.body) {
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
    
    // Extract query params
    req.query = req.query || {};
    
    // Handle routes
    const path = (req.url || '').split('?')[0];
    
    if (path === '/api/bookings' || path === '/bookings' || path === '') {
      if (req.method === 'GET') {
        await bookingController.getAllBookings(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else if (req.method === 'POST') {
        await bookingController.createBooking(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else if (path.includes('/stats')) {
      if (req.method === 'GET') {
        await bookingController.getBookingStats(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else {
      // Extract ID from path
      const idMatch = path.match(/\/([^\/]+)$/);
      if (idMatch) {
        req.params = { id: idMatch[1] };
        
        if (req.method === 'GET') {
          await bookingController.getBookingById(req, res, (err) => {
            if (err) errorHandler(err, req, res);
          });
        } else if (req.method === 'PUT' && path.includes('/status')) {
          await bookingController.updateBookingStatus(req, res, (err) => {
            if (err) errorHandler(err, req, res);
          });
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    }
  } catch (error) {
    errorHandler(error, req, res);
  }
};
