/**
 * Unified Configuration
 * Single source of truth for all configuration
 */
require('dotenv').config();

const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || 'localhost',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours'
  },
  
  // Admin
  admin: {
    passcode: process.env.ADMIN_PASSCODE || 'admin123',
    jwtSecret: process.env.JWT_SECRET || process.env.ADMIN_PASSCODE || 'admin123',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key_here',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here'
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  
  // CORS
  cors: {
    origins: [
      'https://ajl-tours-frontend.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true
  },
  
  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_here_dev',
    cookieSecret: process.env.COOKIE_SECRET || 'your_cookie_secret_here_dev'
  }
};

module.exports = config;





