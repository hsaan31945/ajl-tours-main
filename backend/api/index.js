/**
 * Unified Vercel Serverless Function
 * Handles all API routes in a single function
 */

// Initialize Vercel Web Analytics
const { inject } = require('@vercel/analytics');
inject();

// Wrap all imports in try-catch to identify which module is failing
let connectDB, setCORSHeaders, errorHandler, tourController, tourService, bookingController, authController, emailController, customerController, exchangeRateController, adminDataController, Division, Tour, Booking, User, getPasswordPolicyMessage, attachPerfLogger;

try {
  connectDB = require('../src/config/database').connectDB;
  setCORSHeaders = require('../src/middleware/cors').setCORSHeaders;
  errorHandler = require('../src/middleware/errorHandler').errorHandler;
  tourController = require('../src/controllers/tourController');
  tourService = require('../src/services/tourService');
  bookingController = require('../src/controllers/bookingController');
  authController = require('../src/controllers/authController');
  emailController = require('../src/controllers/emailController');
  customerController = require('../src/controllers/customerController');
  exchangeRateController = require('../src/controllers/exchangeRateController');
  adminDataController = require('../src/controllers/adminDataController');
  getPasswordPolicyMessage = require('../src/utils/passwordPolicy').getPasswordPolicyMessage;
  attachPerfLogger = require('../src/middleware/perfLogger').attachPerfLogger;
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
    attachPerfLogger(req, res);
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
    if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') && !req.body) {
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
    const queryString = url.includes('?') ? url.split('?').slice(1).join('?') : '';
    req.query = {
      ...(req.query || {}),
      ...Object.fromEntries(new URLSearchParams(queryString)),
    };
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
    if (normalizedPath === '/exchange-rates') {
      if (method === 'GET') {
        await asyncHandler(exchangeRateController.getExchangeRates)(req, res);
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else if (normalizedPath.startsWith('/tours')) {
      if (normalizedPath === '/tours') {
        if (method === 'GET') {
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
        const imageMatch = normalizedPath.match(/\/tours\/([^\/\?]+)\/image$/);
        const reviewMatch = normalizedPath.match(/\/tours\/([^\/\?]+)\/reviews$/);
        const idMatch = normalizedPath.match(/\/tours\/([^\/\?]+)/);
        if (imageMatch) {
          req.params = { id: imageMatch[1] };
          if (method === 'GET') {
            await asyncHandler(tourController.getTourImage.bind(tourController))(req, res);
          } else {
            res.status(405).json({ success: false, error: 'Method not allowed' });
          }
        } else if (reviewMatch) {
          req.params = { id: reviewMatch[1] };
          if (method === 'POST') {
            await asyncHandler(tourController.addTourReview.bind(tourController))(req, res);
          } else {
            res.status(405).json({ success: false, error: 'Method not allowed' });
          }
        } else if (idMatch) {
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
      req.query = req.query || {};

      if (normalizedPath === '/bookings') {
        if (method === 'GET') {
          await asyncHandler(bookingController.getAllBookings.bind(bookingController))(req, res);
        } else if (method === 'POST') {
          await asyncHandler(bookingController.createBooking.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else if (normalizedPath === '/bookings/stats' || normalizedPath === '/bookings/stats/summary') {
        if (method === 'GET') {
          const { authenticateAdmin } = require('../src/middleware/auth');
          try {
            await new Promise((resolve, reject) => {
              authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
            });
          } catch (authError) {
            return errorHandler(authError, req, res);
          }
          await asyncHandler(bookingController.getBookingStats.bind(bookingController))(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        const statusMatch = normalizedPath.match(/^\/bookings\/([^/]+)\/status$/);
        const idMatch = normalizedPath.match(/^\/bookings\/([^/]+)$/);

        if (statusMatch) {
          req.params = { id: statusMatch[1] };
          if (method === 'PUT') {
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
              });
            } catch (authError) {
              return errorHandler(authError, req, res);
            }
            await asyncHandler(bookingController.updateBookingStatus.bind(bookingController))(req, res);
          } else {
            res.status(405).json({ success: false, error: 'Method not allowed' });
          }
        } else if (idMatch) {
          req.params = { id: idMatch[1] };
          if (method === 'GET') {
            await asyncHandler(bookingController.getBookingById.bind(bookingController))(req, res);
          } else if (method === 'DELETE') {
            const { authenticateAdmin } = require('../src/middleware/auth');
            try {
              await new Promise((resolve, reject) => {
                authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
              });
            } catch (authError) {
              return errorHandler(authError, req, res);
            }
            await asyncHandler(bookingController.deleteBooking.bind(bookingController))(req, res);
          } else {
            res.status(405).json({ success: false, error: 'Method not allowed' });
          }
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
      }
    } else if (normalizedPath.startsWith('/divisions')) {
      if (normalizedPath === '/divisions') {
        if (method === 'GET') {
          const divisions = await Division.find({
            isActive: true,
            $or: [
              { slug: { $in: ['switzerland', 'srilanka', 'sri-lanka'] } },
              { name: /^Switzerland$/i },
              { name: /^Srilanka$/i },
              { name: /^Sri Lanka$/i },
            ],
          }).sort({ name: 1 }).lean();
          res.json(divisions.map(div => ({
            id: div._id.toString(),
            _id: div._id.toString(),
            name: div.name,
            description: div.description,
            bannerImage: div.bannerImage,
            banner_image: div.bannerImage,
            isActive: div.isActive
          })));
        } else if (method === 'POST') {
          const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
          const expected = process.env.ADMIN_PASSCODE || '';
          if (!expected || !header || header.trim() !== expected.trim()) {
            return res.status(401).json({ message: 'Invalid or missing admin passcode' });
          }
          const { name, description, bannerImage, banner_image } = req.body;
          if (!name) {
            return res.status(400).json({ message: 'Name is required' });
          }
          const division = new Division({
            name: String(name).trim(),
            description: description || '',
            bannerImage: bannerImage || banner_image || '',
          });
          await division.save();
          tourService.clearListCache();
          res.status(201).json({
            id: division._id.toString(),
            _id: division._id.toString(),
            name: division.name,
            description: division.description,
            bannerImage: division.bannerImage,
            banner_image: division.bannerImage,
            isActive: division.isActive
          });
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      } else {
        const divisionId = normalizedPath.replace('/divisions/', '').split('/')[0];
        if ((method === 'PUT' || method === 'PATCH') && divisionId) {
          const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
          const expected = process.env.ADMIN_PASSCODE || '';
          if (!expected || !header || header.trim() !== expected.trim()) {
            return res.status(401).json({ message: 'Invalid or missing admin passcode' });
          }
          const { name, description, bannerImage, banner_image } = req.body;
          if (!name) {
            return res.status(400).json({ message: 'Name is required' });
          }
          const division = await Division.findByIdAndUpdate(
            divisionId,
            {
              name: String(name).trim(),
              description: description || '',
              bannerImage: bannerImage || banner_image || '',
            },
            { new: true, runValidators: true }
          );
          if (!division) {
            return res.status(404).json({ message: 'Division not found' });
          }
          tourService.clearListCache();
          res.json({
            id: division._id.toString(),
            _id: division._id.toString(),
            name: division.name,
            description: division.description,
            bannerImage: division.bannerImage,
            banner_image: division.bannerImage,
            isActive: division.isActive
          });
        } else if (method === 'DELETE' && divisionId) {
          const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
          const expected = process.env.ADMIN_PASSCODE || '';
          if (!expected || !header || header.trim() !== expected.trim()) {
            return res.status(401).json({ message: 'Invalid or missing admin passcode' });
          }
          const linkedTours = await Tour.countDocuments({ division: divisionId });
          if (linkedTours > 0) {
            return res.status(409).json({
              message: `This division is assigned to ${linkedTours} tour${linkedTours === 1 ? '' : 's'}. Move or delete those tours before removing the division.`
            });
          }
          const division = await Division.findByIdAndUpdate(
            divisionId,
            { isActive: false },
            { new: true }
          );
          if (!division) {
            return res.status(404).json({ message: 'Division not found' });
          }
          tourService.clearListCache();
          res.json({
            id: division._id.toString(),
            _id: division._id.toString(),
            name: division.name,
            description: division.description,
            isActive: division.isActive
          });
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
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

      user.lastLoginAt = new Date();
      user.loginActivity = [
        ...(Array.isArray(user.loginActivity) ? user.loginActivity : []),
        {
          occurredAt: user.lastLoginAt,
          userAgent: String(req.headers['user-agent'] || '').slice(0, 300)
        }
      ].slice(-10);
      await user.save();

      res.status(200).json(user);
    } else if (normalizedPath === '/admin/summary' || normalizedPath.startsWith('/admin/bookings') || normalizedPath.startsWith('/admin/users') || normalizedPath.startsWith('/admin/divisions') || normalizedPath === '/admin/settings') {
      const { authenticateAdmin } = require('../src/middleware/auth');
      try {
        await new Promise((resolve, reject) => {
          authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
        });
      } catch (authError) {
        return errorHandler(authError, req, res);
      }

      if (normalizedPath === '/admin/summary' && method === 'GET') {
        await asyncHandler(adminDataController.getDashboardSummary)(req, res);
      } else if (normalizedPath === '/admin/bookings' && method === 'GET') {
        await asyncHandler(adminDataController.listAdminBookings)(req, res);
      } else if (normalizedPath === '/admin/bookings/stats' && method === 'GET') {
        await asyncHandler(adminDataController.getAdminBookingStats)(req, res);
      } else {
        const adminBookingStatusMatch = normalizedPath.match(/^\/admin\/bookings\/([^/]+)\/status$/);
        const adminBookingMatch = normalizedPath.match(/^\/admin\/bookings\/([^/]+)$/);
        const adminUserMatch = normalizedPath.match(/^\/admin\/users\/([^/]+)$/);
        const adminDivisionMatch = normalizedPath.match(/^\/admin\/divisions\/([^/]+)$/);

        if (adminBookingStatusMatch && method === 'PUT') {
          req.params = { id: decodeURIComponent(adminBookingStatusMatch[1]) };
          await asyncHandler(bookingController.updateBookingStatus.bind(bookingController))(req, res);
        } else if (adminBookingMatch && method === 'DELETE') {
          req.params = { id: decodeURIComponent(adminBookingMatch[1]) };
          await asyncHandler(bookingController.deleteBooking.bind(bookingController))(req, res);
        } else if (normalizedPath === '/admin/users' && method === 'GET') {
          await asyncHandler(adminDataController.listUsers)(req, res);
        } else if (normalizedPath === '/admin/users' && method === 'POST') {
          await asyncHandler(adminDataController.addUser)(req, res);
        } else if (adminUserMatch && method === 'GET') {
          req.params = { id: decodeURIComponent(adminUserMatch[1]) };
          await asyncHandler(adminDataController.getUserDetails)(req, res);
        } else if (adminUserMatch && method === 'DELETE') {
          req.params = { id: decodeURIComponent(adminUserMatch[1]) };
          await asyncHandler(adminDataController.deleteUser)(req, res);
        } else if (normalizedPath === '/admin/divisions' && method === 'GET') {
          await asyncHandler(adminDataController.listDivisions)(req, res);
        } else if (normalizedPath === '/admin/divisions/cleanup' && method === 'POST') {
          await asyncHandler(adminDataController.cleanupCountryPages)(req, res);
        } else if (normalizedPath === '/admin/divisions' && method === 'POST') {
          await asyncHandler(adminDataController.saveDivision)(req, res);
        } else if (adminDivisionMatch && (method === 'PUT' || method === 'PATCH')) {
          req.params = { id: decodeURIComponent(adminDivisionMatch[1]) };
          await asyncHandler(adminDataController.saveDivision)(req, res);
        } else if (adminDivisionMatch && method === 'DELETE') {
          req.params = { id: decodeURIComponent(adminDivisionMatch[1]) };
          await asyncHandler(adminDataController.deleteDivision)(req, res);
        } else if (normalizedPath === '/admin/settings' && method === 'GET') {
          await asyncHandler(adminDataController.getSettings)(req, res);
        } else if (normalizedPath === '/admin/settings' && method === 'PUT') {
          await asyncHandler(adminDataController.updateSettings)(req, res);
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
      }
    } else if (normalizedPath === '/admin/content' || normalizedPath.startsWith('/admin/content/')) {
      const adminController = require('../controllers/adminController');
      const { authenticateAdmin } = require('../src/middleware/auth');
      try {
        await new Promise((resolve, reject) => {
          authenticateAdmin(req, res, (err) => err ? reject(err) : resolve());
        });
      } catch (authError) {
        return errorHandler(authError, req, res);
      }

      if (normalizedPath === '/admin/content' && method === 'GET') {
        await adminController.getAllHomepageContent(req, res);
      } else {
        const sectionMatch = normalizedPath.match(/^\/admin\/content\/([^/]+)$/);
        if (!sectionMatch) {
          res.status(404).json({ success: false, error: 'Route not found', path: normalizedPath });
        } else if (method === 'GET') {
          req.params = { section: decodeURIComponent(sectionMatch[1]) };
          await adminController.getHomepageContent(req, res);
        } else if (method === 'PUT') {
          req.params = { section: decodeURIComponent(sectionMatch[1]) };
          await adminController.updateHomepageContent(req, res);
        } else {
          res.status(405).json({ success: false, error: 'Method not allowed' });
        }
      }
    } else if (normalizedPath === '/admin/verify' && method === 'POST') {
      const passcode =
        req.body?.passcode ||
        req.headers['x-admin-passcode'] ||
        req.headers['X-Admin-Passcode'] ||
        '';
      const expected = process.env.ADMIN_PASSCODE || '';

      if (!expected || String(passcode).trim() !== String(expected).trim()) {
        return res.status(401).json({ success: false, error: 'Invalid passcode' });
      }

      res.status(200).json({ success: true });
    } else if (normalizedPath === '/admin/login' && method === 'POST') {
      await asyncHandler(authController.adminLogin.bind(authController))(req, res);
    } else if (normalizedPath.startsWith('/auth')) {
      if (normalizedPath === '/auth/send-reset-otp' && method === 'POST') {
        await asyncHandler(emailController.sendResetOtp.bind(emailController))(req, res);
      } else if (normalizedPath === '/auth/reset-password' && method === 'POST') {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');

        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'Email and new password are required' });
        }

        const passwordMessage = getPasswordPolicyMessage(password);
        if (passwordMessage) {
          return res.status(400).json({ success: false, error: passwordMessage });
        }

        const user = await User.findOne({ email, isActive: true });
        if (!user) {
          return res.status(404).json({ success: false, error: "Account with this email doesn't exist." });
        }

        user.password = password;
        user.passwordChangedAt = new Date();
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successfully' });
      } else if (normalizedPath.includes('/admin/login') && method === 'POST') {
        await asyncHandler(authController.adminLogin.bind(authController))(req, res);
      } else if (normalizedPath.includes('/admin/create') && method === 'POST') {
        await asyncHandler(authController.createAdmin.bind(authController))(req, res);
      } else {
        res.status(404).json({ success: false, error: 'Route not found' });
      }
    } else if (normalizedPath.startsWith('/customer')) {
      const customerPath = normalizedPath.replace(/^\/customer/, '') || '/';

      if (customerPath === '/overview' && method === 'GET') {
        await asyncHandler(customerController.getOverview.bind(customerController))(req, res);
      } else if (customerPath === '/bookings' && method === 'GET') {
        await asyncHandler(customerController.getBookings.bind(customerController))(req, res);
      } else if (customerPath === '/profile' && method === 'GET') {
        await asyncHandler(customerController.getProfile.bind(customerController))(req, res);
      } else if (customerPath === '/profile' && method === 'PUT') {
        await asyncHandler(customerController.updateProfile.bind(customerController))(req, res);
      } else if (customerPath === '/profile/password' && method === 'PUT') {
        await asyncHandler(customerController.changePassword.bind(customerController))(req, res);
      } else if (customerPath === '/notifications' && method === 'GET') {
        await asyncHandler(customerController.getNotifications.bind(customerController))(req, res);
      } else if (customerPath === '/notifications/read-all' && method === 'PATCH') {
        await asyncHandler(customerController.markAllNotificationsRead.bind(customerController))(req, res);
      } else if (customerPath === '/payments' && method === 'GET') {
        await asyncHandler(customerController.getPayments.bind(customerController))(req, res);
      } else if (customerPath === '/support-tickets' && method === 'GET') {
        await asyncHandler(customerController.getSupportTickets.bind(customerController))(req, res);
      } else if (customerPath === '/support-tickets' && method === 'POST') {
        await asyncHandler(customerController.createSupportTicket.bind(customerController))(req, res);
      } else if (customerPath === '/wishlist' && method === 'GET') {
        await asyncHandler(customerController.getWishlist.bind(customerController))(req, res);
      } else if (customerPath === '/wishlist' && method === 'POST') {
        await asyncHandler(customerController.addWishlistItem.bind(customerController))(req, res);
      } else if (customerPath === '/security' && method === 'GET') {
        await asyncHandler(customerController.getSecurity.bind(customerController))(req, res);
      } else {
        const bookingCancelMatch = customerPath.match(/^\/bookings\/([^/]+)\/cancel$/);
        const bookingDetailMatch = customerPath.match(/^\/bookings\/([^/]+)$/);
        const notificationReadMatch = customerPath.match(/^\/notifications\/([^/]+)\/read$/);
        const supportTicketMatch = customerPath.match(/^\/support-tickets\/([^/]+)$/);
        const wishlistDeleteMatch = customerPath.match(/^\/wishlist\/([^/]+)$/);

        if (bookingCancelMatch && method === 'PUT') {
          req.params = { id: decodeURIComponent(bookingCancelMatch[1]) };
          await asyncHandler(customerController.cancelBooking.bind(customerController))(req, res);
        } else if (bookingDetailMatch && method === 'GET') {
          req.params = { id: decodeURIComponent(bookingDetailMatch[1]) };
          await asyncHandler(customerController.getBookingById.bind(customerController))(req, res);
        } else if (notificationReadMatch && method === 'PATCH') {
          req.params = { id: decodeURIComponent(notificationReadMatch[1]) };
          await asyncHandler(customerController.markNotificationRead.bind(customerController))(req, res);
        } else if (supportTicketMatch && method === 'GET') {
          req.params = { id: decodeURIComponent(supportTicketMatch[1]) };
          await asyncHandler(customerController.getSupportTicketById.bind(customerController))(req, res);
        } else if (wishlistDeleteMatch && method === 'DELETE') {
          req.params = { tourId: decodeURIComponent(wishlistDeleteMatch[1]) };
          await asyncHandler(customerController.removeWishlistItem.bind(customerController))(req, res);
        } else {
          res.status(404).json({ success: false, error: 'Route not found' });
        }
      }
    } else if (normalizedPath === '/migrate-tours' && method === 'POST') {
      res.status(410).json({
        success: false,
        message: 'Hardcoded tour migration is disabled. MongoDB tours are the only source of truth.'
      });
    } else if (normalizedPath.startsWith('/content/homepage')) {
      const contentController = require('../controllers/contentController');
      if (normalizedPath === '/content/homepage/hero_banners/image' && method === 'GET') {
        await contentController.getPublicHomepageImage(req, res);
      } else if (normalizedPath === '/content/homepage' && method === 'GET') {
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
      const { getValidatedTourPricing } = require('../src/services/bookingPricingService');
      const pricing = await getValidatedTourPricing(req.body || {});
      const pricingPayload = {
        unitPrice: pricing.pricedUnit,
        baseUnitPrice: pricing.unitPrice,
        originalUnitPrice: pricing.originalUnitPrice,
        discountUnitPrice: pricing.discountUnitPrice,
        saleUnitPrice: pricing.saleUnitPrice,
        groupDiscount: pricing.groupDiscount,
        groupDiscountTier: pricing.groupDiscountTier,
        groupDiscountUnitAmount: pricing.groupDiscountUnitAmount,
        groupDiscountTotal: pricing.groupDiscountTotal,
        hasGroupDiscount: pricing.hasGroupDiscount,
        tickets: pricing.tickets,
        minTickets: pricing.minTickets,
        total: pricing.total,
        flexibility: pricing.flexibility,
      };
      if (pricing.amountInCents <= 0) {
        return res.json({
          success: true,
          freeCheckout: true,
          clientSecret: null,
          amount: 0,
          currency: pricing.currency.toUpperCase(),
          pricing: pricingPayload,
        });
      }
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
      const paymentIntent = await stripe.paymentIntents.create({
        amount: pricing.amountInCents,
        currency: pricing.currency,
        metadata: {
          tourId: String(pricing.tour._id),
          tourName: pricing.tour.name,
          tickets: String(pricing.tickets),
          minTickets: String(pricing.minTickets),
          unitPrice: String(pricing.pricedUnit),
          total: String(pricing.total),
          groupDiscountTier: pricing.groupDiscountTier || '',
          groupDiscountUnitAmount: String(pricing.groupDiscountUnitAmount || 0),
          groupDiscountTotal: String(pricing.groupDiscountTotal || 0),
          currency: pricing.currency.toUpperCase(),
          flexibility: pricing.flexibility,
          selectedDate: req.body?.selectedDate ? String(req.body.selectedDate).slice(0, 10) : '',
        },
        automatic_payment_methods: { enabled: true },
      });
      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: pricing.total,
        currency: pricing.currency.toUpperCase(),
        pricing: pricingPayload,
      });
    } else if (normalizedPath === '/confirm-free-booking' && method === 'POST') {
      const { getValidatedTourPricing } = require('../src/services/bookingPricingService');
      const bookingService = require('../src/services/bookingService');
      const { bookingData = {} } = req.body || {};
      const pricing = await getValidatedTourPricing({
        tourId: req.body?.tourId || bookingData.tourId,
        tickets: req.body?.tickets ?? bookingData.tickets ?? bookingData.travelers,
        selectedDate: req.body?.selectedDate || bookingData.selectedDate || bookingData.tripDate,
        flexibility: req.body?.flexibility || bookingData.flexibility,
      });

      if (pricing.amountInCents > 0) {
        return res.status(400).json({
          success: false,
          error: 'This booking requires payment and cannot use free checkout.',
        });
      }

      const selectedDate = req.body?.selectedDate || bookingData.selectedDate || bookingData.tripDate || new Date();
      const freePaymentId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const booking = await bookingService.createBooking({
        ...bookingData,
        tourId: String(pricing.tour._id),
        tickets: pricing.tickets,
        travelers: pricing.tickets,
        selectedDate,
        tripDate: selectedDate,
        flexibility: pricing.flexibility,
        status: 'pending',
        paymentStatus: 'paid',
        stripePaymentId: freePaymentId,
      });

      res.json({
        success: true,
        freeCheckout: true,
        paymentIntentId: freePaymentId,
        booking,
      });
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
      const { paymentIntentId, bookingData = {} } = req.body || {};
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        const bookingService = require('../src/services/bookingService');
        const metadata = paymentIntent.metadata || {};
        const booking = await bookingService.createBooking({
          ...bookingData,
          tourId: metadata.tourId || bookingData.tourId,
          tickets: metadata.tickets || bookingData.tickets || bookingData.travelers,
          travelers: metadata.tickets || bookingData.tickets || bookingData.travelers,
          flexibility: metadata.flexibility || bookingData.flexibility,
          selectedDate: metadata.selectedDate || bookingData.selectedDate || bookingData.tripDate,
          tripDate: metadata.selectedDate || bookingData.tripDate || bookingData.selectedDate || new Date(),
          status: 'pending',
          paymentStatus: 'paid',
          stripePaymentId: paymentIntentId
        });
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
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : 'Internal server error',
      message: error.message,
      path: req.url
    });
  }
};
