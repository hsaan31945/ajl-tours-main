/**
 * Unified Vercel Serverless Function
 * Handles all API routes in a single function to avoid Vercel limit
 */
const { connectDB } = require('../src/config/database');
const { setCORSHeaders } = require('../src/middleware/cors');
const { errorHandler } = require('../src/middleware/errorHandler');

// Import controllers
const tourController = require('../src/controllers/tourController');
const bookingController = require('../src/controllers/bookingController');
const authController = require('../src/controllers/authController');

// Import models
const Division = require('../models/Division');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

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
    
    // Parse body for POST/PUT requests
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
    
    // Extract path and method
    let url = req.url || '';
    let path = url.split('?')[0];
    
    // Vercel might pass /api/index.js or /index.js due to rewrites
    // If so, look at x-now-route-matches or other headers if available, 
    // or just assume it's the base if it points to the file itself
    if (path.includes('index.js')) {
      // If we're hitting the file itself but have a path suffix in query, use that
      // Otherwise fallback to /
      path = req.query?.path || '/';
    }

    // Normalize path - handle both /api/tours and /tours
    if (path.startsWith('/api/')) {
      path = path.substring(4); // Remove /api prefix
    }
    // Also handle if path doesn't start with / (Vercel might strip it)
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    const method = req.method;
    
    // Debug logging
    console.log('API Request:', { 
      method, 
      originalUrl: url, 
      normalizedPath: path,
      headers: req.headers
    });
    
    // Helper to wrap async controller with error handling
    const asyncHandler = (controllerFn) => {
      return async (req, res) => {
        try {
          await controllerFn(req, res, (err) => {
            if (err) {
              return errorHandler(err, req, res);
            }
          });
        } catch (err) {
          return errorHandler(err, req, res);
        }
      };
    };

    // Route to appropriate controller
    // Path is now normalized (no /api prefix)
    // Handle both /tours and tours (with or without leading slash)
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    
    if (normalizedPath.startsWith('/tours')) {
      // Tour routes
      if (normalizedPath === '/tours') {
        if (method === 'GET') {
          await asyncHandler(tourController.getAllTours.bind(tourController))(req, res);
        } else if (method === 'POST') {
          console.log('POST /tours - Creating tour');
          // Add auth and validation before creating tour
          const { authenticateAdmin } = require('../src/middleware/auth');
          const { validateTourData } = require('../src/middleware/validation');
          try {
            // Authenticate first
            console.log('Authenticating admin...');
            await new Promise((resolve, reject) => {
              authenticateAdmin(req, res, (err) => {
                if (err) {
                  console.error('Auth error:', err);
                  reject(err);
                } else {
                  console.log('Auth successful');
                  resolve();
                }
              });
            });
            // Then validate
            console.log('Validating tour data...');
            await new Promise((resolve, reject) => {
              validateTourData(req, res, (err) => {
                if (err) {
                  console.error('Validation error:', err);
                  reject(err);
                } else {
                  console.log('Validation successful');
                  resolve();
                }
              });
            });
            console.log('Calling createTour controller...');
            await asyncHandler(tourController.createTour.bind(tourController))(req, res);
          } catch (error) {
            console.error('Error in tour creation flow:', error);
            return errorHandler(error, req, res);
          }
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        // Tour by ID: /api/tours/:id or /tours/:id
        const idMatch = normalizedPath.match(/\/tours\/([^\/\?]+)/);
        if (idMatch) {
          req.params = { id: idMatch[1] };
          
          if (method === 'GET') {
            await asyncHandler(tourController.getTourById.bind(tourController))(req, res);
          } else if (method === 'PUT') {
            // Add auth check for updates
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
              await asyncHandler(tourController.updateTour.bind(tourController))(req, res);
            } catch (authError) {
              return errorHandler(authError, req, res);
            }
          } else if (method === 'DELETE') {
            // Add auth check for deletes
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => {
                  if (err) reject(err);
                  else resolve();
                });
              });
              await asyncHandler(tourController.deleteTour.bind(tourController))(req, res);
            } catch (authError) {
              return errorHandler(authError, req, res);
            }
          } else {
            res.status(405).json({ success: false, error: 'Method not allowed' });
          }
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
      }
    } else if (normalizedPath.startsWith('/bookings')) {
      // Booking routes
      if (normalizedPath === '/bookings') {
        req.query = req.query || {};
        if (method === 'GET') {
          await asyncHandler(bookingController.getAllBookings.bind(bookingController))(req, res);
        } else if (method === 'POST') {
          await asyncHandler(bookingController.createBooking.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else if (normalizedPath.includes('/status')) {
        const idMatch = normalizedPath.match(/\/bookings\/([^\/]+)/);
        if (idMatch && method === 'PUT') {
          req.params = { id: idMatch[1] };
          await asyncHandler(bookingController.updateBookingStatus.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else if (normalizedPath.includes('/stats')) {
        if (method === 'GET') {
          await asyncHandler(bookingController.getBookingStats.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        // Booking by ID
        const idMatch = normalizedPath.match(/\/bookings\/([^\/\?]+)/);
        if (idMatch && method === 'GET') {
          req.params = { id: idMatch[1] };
          await asyncHandler(bookingController.getBookingById.bind(bookingController))(req, res);
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
      }
    } else if (normalizedPath.startsWith('/divisions')) {
      // Divisions routes
      if (normalizedPath === '/divisions') {
        if (method === 'GET') {
          try {
            const divisions = await Division.find({ isActive: true }).sort({ name: 1 }).lean();
            res.json(divisions.map(div => ({
              id: div._id.toString(),
              _id: div._id.toString(),
              name: div.name,
              description: div.description,
              isActive: div.isActive
            })));
          } catch (err) {
            return errorHandler(err, req, res);
          }
        } else if (method === 'POST') {
          try {
            const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
            const expected = process.env.ADMIN_PASSCODE || 'admin123';
            if (!header || header.trim() !== expected.trim()) {
              return res.status(401).json({ message: 'Invalid or missing admin passcode' });
            }
            const { name, description } = req.body;
            if (!name) {
              return res.status(400).json({ message: 'Name is required' });
            }
            const division = new Division({ name, description: description || '' });
            await division.save();
            res.status(201).json({
              id: division._id.toString(),
              _id: division._id.toString(),
              name: division.name,
              description: division.description,
              isActive: division.isActive
            });
          } catch (err) {
            return errorHandler(err, req, res);
          }
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath.startsWith('/auth')) {
      // Auth routes
      if (normalizedPath.includes('/admin/login') && method === 'POST') {
        await asyncHandler(authController.adminLogin.bind(authController))(req, res);
      } else if (normalizedPath.includes('/admin/create') && method === 'POST') {
        await asyncHandler(authController.createAdmin.bind(authController))(req, res);
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath === '/migrate-tours' && method === 'POST') {
      try {
        const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
        const expected = process.env.ADMIN_PASSCODE || 'admin123';
        if (!header || header.trim() !== expected.trim()) {
          return res.status(401).json({ message: 'Invalid or missing admin passcode' });
        }

        const { hardcodedTours } = require('../data/migrate-tours-data');
        
        let switzerlandDivision = await Division.findOne({ name: 'Switzerland' });
        if (!switzerlandDivision) {
          switzerlandDivision = new Division({
            name: 'Switzerland',
            description: 'Tours in Switzerland',
            isActive: true
          });
          await switzerlandDivision.save();
        }

        const results = [];
        for (const tourData of hardcodedTours) {
          try {
            let existingTour = await Tour.findOne({ name: tourData.name });

            const tourPayload = {
              division: switzerlandDivision._id,
              name: tourData.name,
              description: tourData.description || '',
              overview: tourData.description || '',
              price: tourData.price,
              startLocation: tourData.address || 'Zurich Main Station, Zurich, Switzerland',
              endLocation: tourData.address || 'Zurich Main Station, Zurich, Switzerland',
              startDate: new Date(),
              endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
              images: tourData.images || [],
              isActive: true,
              metadata: {
                features: tourData.features || [],
                rating: tourData.rating || 4.9,
                reviews: tourData.reviews || 0,
                address: tourData.address
              }
            };

            if (existingTour) {
              Object.assign(existingTour, tourPayload);
              await existingTour.save();
              results.push({ action: 'updated', name: tourData.name, id: existingTour._id.toString() });
            } else {
              const newTour = new Tour(tourPayload);
              await newTour.save();
              results.push({ action: 'created', name: tourData.name, id: newTour._id.toString() });
            }
          } catch (tourError) {
            results.push({ action: 'error', name: tourData.name, error: tourError.message });
          }
        }
        res.status(200).json({ success: true, message: `Migrated ${results.length} tours`, results });
      } catch (err) {
        return errorHandler(err, req, res);
      }
    } else if (normalizedPath === '/create-payment-intent' && method === 'POST') {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const { amount, currency = 'usd', metadata = {} } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency,
          metadata,
          automatic_payment_methods: { enabled: true },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (err) {
        return errorHandler(err, req, res);
      }
    } else if (normalizedPath === '/confirm-payment' && method === 'POST') {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const { paymentIntentId, bookingData } = req.body;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
          const booking = new Booking({
            ...bookingData,
            tripDate: new Date(bookingData.tripDate),
            paymentStatus: 'paid',
            stripePaymentId: paymentIntentId
          });
          await booking.save();
          res.json({ success: true, booking });
        } else {
          res.status(400).json({ success: false, error: 'Payment not completed' });
        }
      } catch (err) {
        return errorHandler(err, req, res);
      }
    } else if (normalizedPath === '/debug') {
      try {
        const config = require('../src/config/index');
        res.json({
          message: 'Debug route in index.js is working',
          env: process.env.NODE_ENV,
          mongoConfigured: !!config.mongodb.uri,
          normalizedPath,
          path,
          url
        });
      } catch (err) {
        res.status(500).json({ error: 'Debug failed', message: err.message, stack: err.stack });
      }
    } else if (normalizedPath === '/health' || normalizedPath === '' || normalizedPath === '/') {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: 'serverless'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: path
      });
    }
  } catch (error) {
    console.error('CRITICAL API ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Internal function error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.url
    });
  }
};
