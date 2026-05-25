/**
 * Unified Vercel Serverless Function
 * Handles all API routes in a single function
 */

// Wrap all imports in try-catch to identify which module is failing
let connectDB, setCORSHeaders, errorHandler, tourController, bookingController, authController, Division, Tour, Booking, User;

try {
  connectDB = require('../src/config/database').connectDB;
  setCORSHeaders = require('../src/middleware/cors').setCORSHeaders;
  errorHandler = require('../src/middleware/errorHandler').errorHandler;
  tourController = require('../src/controllers/tourController');
  bookingController = require('../src/controllers/bookingController');
  authController = require('../src/controllers/authController');
  Division = require('../models/Division');
  Tour = require('../models/Tour');
  Booking = require('../models/Booking');
  User = require('../models/User');
} catch (importError) {
  // If imports fail, export a handler that reports the error
  module.exports = async (req, res) => {
    res.status(500).json({
      error: 'Module import failed',
      message: importError.message,
      stack: importError.stack
    });
  };
  return;
}

module.exports = async (req, res) => {
  // Set CORS headers first
  try {
    setCORSHeaders(req, res);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  }
  
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
    
    // Normalize path - handle both /api/tours and /tours
    if (path.startsWith('/api/')) {
      path = path.substring(4); // Remove /api prefix
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    const method = req.method;
    const normalizedPath = path;
    
    // Debug logging
    console.log('API Request:', { method, url, normalizedPath });
    
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

    // Route handling
    if (normalizedPath.startsWith('/tours')) {
      if (normalizedPath === '/tours') {
        if (method === 'GET') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          await asyncHandler(tourController.getAllTours.bind(tourController))(req, res);
        } else if (method === 'POST') {
          const { authenticateAdmin } = require('../src/middleware/auth');
          const { validateTourData } = require('../src/middleware/validation');
          try {
            await new Promise((resolve, reject) => {
              authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
            });
            await new Promise((resolve, reject) => {
              validateTourData(req, res, (err) => err ? reject(err) : resolve());
            });
            await asyncHandler(tourController.createTour.bind(tourController))(req, res);
          } catch (error) {
            return errorHandler(error, req, res);
          }
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        // Tour by ID
        const idMatch = normalizedPath.match(/\/tours\/([^\/\?]+)/);
        if (idMatch) {
          req.params = { id: idMatch[1] };
          if (method === 'GET') {
            await asyncHandler(tourController.getTourById.bind(tourController))(req, res);
          } else if (method === 'PUT') {
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
              });
              await asyncHandler(tourController.updateTour.bind(tourController))(req, res);
            } catch (authError) {
              return errorHandler(authError, req, res);
            }
          } else if (method === 'DELETE') {
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
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
      if (normalizedPath === '/bookings') {
        req.query = req.query || {};
        if (method === 'GET') {
          await asyncHandler(bookingController.getAllBookings.bind(bookingController))(req, res);
        } else if (method === 'POST') {
          await asyncHandler(bookingController.createBooking.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath.startsWith('/divisions')) {
      if (normalizedPath === '/divisions') {
        if (method === 'GET') {
          const divisions = await Division.find({ isActive: true }).sort({ name: 1 }).lean();
          res.json(divisions.map(div => ({
            id: div._id.toString(),
            _id: div._id.toString(),
            name: div.name,
            description: div.description,
            isActive: div.isActive
          })));
        } else if (method === 'POST') {
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
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath === '/users' && method === 'POST') {
      const { name, email, password, phone } = req.body || {};
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email and password are required' });
      }

      const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists' });
      }

      const user = new User({
        name,
        email,
        password,
        phone: phone || '',
      });
      await user.save();
      res.status(201).json(user);
    } else if (normalizedPath === '/users/login' && method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const user = await User.findOne({ email: String(email).toLowerCase().trim(), isActive: true });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, error: 'Invalid login credentials' });
      }

      res.status(200).json(user);
    } else if (normalizedPath === '/admin/verify' && method === 'POST') {
      const passcode =
        req.body?.passcode ||
        req.headers['x-admin-passcode'] ||
        req.headers['X-Admin-Passcode'] ||
        '';
      const expected = process.env.ADMIN_PASSCODE || 'admin123';

      if (String(passcode).trim() !== String(expected).trim()) {
        return res.status(401).json({ success: false, error: 'Invalid passcode' });
      }

      res.status(200).json({ success: true });
    } else if (normalizedPath.startsWith('/auth')) {
      if (normalizedPath.includes('/admin/login') && method === 'POST') {
        await asyncHandler(authController.adminLogin.bind(authController))(req, res);
      } else if (normalizedPath.includes('/admin/create') && method === 'POST') {
        await asyncHandler(authController.createAdmin.bind(authController))(req, res);
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath === '/migrate-tours' && method === 'POST') {
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
            startLocation: tourData.address || 'Zurich Main Station',
            endLocation: tourData.address || 'Zurich Main Station',
            startDate: new Date(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
            images: tourData.images || [],
            isActive: true
          };
          if (existingTour) {
            Object.assign(existingTour, tourPayload);
            await existingTour.save();
            results.push({ action: 'updated', name: tourData.name });
          } else {
            const newTour = new Tour(tourPayload);
            await newTour.save();
            results.push({ action: 'created', name: tourData.name });
          }
        } catch (tourError) {
          results.push({ action: 'error', name: tourData.name, error: tourError.message });
        }
      }
      res.status(200).json({ success: true, message: `Migrated ${results.length} tours`, results });
    } else if (normalizedPath.startsWith('/content/homepage')) {
      const contentController = require('../controllers/contentController');
      if (normalizedPath === '/content/homepage' && method === 'GET') {
        await contentController.getAllPublicHomepageContent(req, res);
      } else {
        const sectionMatch = normalizedPath.match(/^\/content\/homepage\/([^/]+)/);
        if (sectionMatch && method === 'GET') {
          req.params = { section: sectionMatch[1] };
          await contentController.getPublicHomepageContent(req, res);
        } else {
          res.status(404).json({ success: false, error: 'Route not found', path: normalizedPath });
        }
      }
    } else if (normalizedPath === '/create-payment-intent' && method === 'POST') {
      const config = require('../config');
      let stripeSecretKey = (config.stripe?.secretKey || process.env.STRIPE_SECRET_KEY || '').trim();
      stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');
      if (!stripeSecretKey || stripeSecretKey.includes('your_stripe_secret_key')) {
        return res.status(500).json({
          success: false,
          error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.',
        });
      }
      const stripe = require('stripe')(stripeSecretKey);
      const { amount, currency = 'usd', metadata = {} } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount' });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } else if (normalizedPath === '/confirm-payment' && method === 'POST') {
      const config = require('../config');
      let stripeSecretKey = (config.stripe?.secretKey || process.env.STRIPE_SECRET_KEY || '').trim();
      stripeSecretKey = stripeSecretKey.replace(/^["']|["']$/g, '');
      if (!stripeSecretKey || stripeSecretKey.includes('your_stripe_secret_key')) {
        return res.status(500).json({
          success: false,
          error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in the server environment.',
        });
      }
      const stripe = require('stripe')(stripeSecretKey);
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
        path: normalizedPath
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      path: req.url
    });
  }
};
