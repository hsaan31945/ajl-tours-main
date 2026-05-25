require('dotenv').config();

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || 'localhost',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours'
  },
  
  // Admin
  admin: {
    passcode: process.env.ADMIN_PASSCODE || 'admin123'
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
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || ['http://localhost:5173', 'https://ajl-tours-frontend.vercel.app'],
    credentials: true
  },
  
  // Security
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_here_dev',
    cookieSecret: process.env.COOKIE_SECRET || 'your_cookie_secret_here_dev'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || null
  },
  
  // Performance
  performance: {
    maxFileSize: process.env.MAX_FILE_SIZE || '10mb',
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW || '15m',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};

module.exports = config;
