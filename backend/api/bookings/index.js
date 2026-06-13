/**
 * Vercel Serverless Function - Bookings
 */
const { connectDB } = require('../../src/config/database');
const { setCORSHeaders } = require('../../src/middleware/cors');
const bookingController = require('../../src/controllers/bookingController');
const { errorHandler } = require('../../src/middleware/errorHandler');
const { authenticateAdmin } = require('../../src/middleware/auth');

const requireAdmin = (req, res) => new Promise((resolve, reject) => {
  authenticateAdmin(req, res, (err) => (err ? reject(err) : resolve()));
});

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
        await requireAdmin(req, res);
        await bookingController.getBookingStats(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else {
      // Extract ID from path
      const statusMatch = path.match(/\/bookings\/([^/]+)\/status$/);
      const idMatch = path.match(/\/bookings\/([^/]+)$/);
      if (statusMatch || idMatch) {
        req.params = { id: decodeURIComponent((statusMatch || idMatch)[1]) };
        
        if (req.method === 'GET') {
          await bookingController.getBookingById(req, res, (err) => {
            if (err) errorHandler(err, req, res);
          });
        } else if (req.method === 'PUT' && statusMatch) {
          await requireAdmin(req, res);
          await bookingController.updateBookingStatus(req, res, (err) => {
            if (err) errorHandler(err, req, res);
          });
        } else if (req.method === 'DELETE' && idMatch) {
          await requireAdmin(req, res);
          await bookingController.deleteBooking(req, res, (err) => {
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
