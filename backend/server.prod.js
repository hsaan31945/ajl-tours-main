const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { connectDB } = require('./config/database');
const { sendNewBookingAdminAlert } = require('./src/services/emailService');
const stripe = require('stripe')(config.stripe.secretKey);

// Import Mongoose models
const User = require('./models/User');
const Admin = require('./models/Admin');
const Booking = require('./models/Booking');
const Tour = require('./models/Tour');
const Division = require('./models/Division');
const Trip = require('./models/Trip');
const HomepageContent = require('./models/HomepageContent');

const app = express();

// Production middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for production
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Passcode']
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Make models available to routes
app.locals.models = {
  User,
  Admin,
  Booking,
  Tour,
  Division,
  Trip,
  HomepageContent
};

// Import routes
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const tourRoutes = require('./routes/tours');
const customerRoutes = require('./src/routes/customer');
const exchangeRateRoutes = require('./routes/exchangeRates');
const adminDataRoutes = require('./src/routes/adminData');
const divisionRoutes = require('./src/routes/divisions');
const { sendResetOtp } = require('./src/controllers/emailController');
const { resetPassword } = require('./controllers/authController');

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/admin', adminDataRoutes);
app.use('/api/divisions', divisionRoutes);
app.post('/api/auth/send-reset-otp', sendResetOtp);
app.post('/api/auth/reset-password', resetPassword);

// Stripe payment endpoints
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, bookingData } = req.body;
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Payment confirmed successful - save booking
      const { name, email, phone, travelers, specialRequests, tourTitle, totalPrice, tripDate, address, lat, lng, tourId } = bookingData;
      
      const booking = new Booking({
        name,
        email,
        phone,
        travelers,
        specialRequests,
        tourTitle,
        tourId,
        totalPrice,
        tripDate: new Date(tripDate),
        address,
        location: { lat, lng },
        status: 'pending',
        paymentStatus: 'paid',
        stripePaymentId: paymentIntentId
      });
      
      await booking.save();

      try {
        await sendNewBookingAdminAlert({ booking: booking.toObject ? booking.toObject() : booking });
      } catch (emailError) {
        console.error('New booking admin alert failed:', emailError.response?.data || emailError.message);
      }
      
      res.json({ 
        success: true, 
        booking: booking,
        paymentIntent: paymentIntent 
      });
    } else {
      // Payment failed or pending
      res.status(400).json({ 
        success: false, 
        error: 'Payment not completed',
        status: paymentIntent.status,
        lastError: paymentIntent.last_payment_error
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from React build (for production)
if (config.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    database: 'MongoDB Connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    const server = app.listen(config.PORT, config.HOST, () => {
      console.log(`🚀 Production server running on ${config.HOST}:${config.PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${config.cors.origin}`);
      console.log(`📊 Database: MongoDB`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
