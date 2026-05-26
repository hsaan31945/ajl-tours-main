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
    uri: process.env.MONGODB_URI || ''
  },
  
  // Admin
  admin: {
    passcode: process.env.ADMIN_PASSCODE || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  
  // CORS
  cors: {
    origins: [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'https://ajl-tours-frontend-eta.vercel.app',
      'https://ajl-tours-frontend.vercel.app',
      'http://localhost:5173'
    ].filter(Boolean),
    credentials: true
  },
  
  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET || '',
    cookieSecret: process.env.COOKIE_SECRET || ''
  }
};

module.exports = config;



