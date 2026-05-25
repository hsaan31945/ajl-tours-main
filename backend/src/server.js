/**
 * Express Server Setup
 * Main application entry point
 */
const express = require('express');
const config = require('./config');
const { connectDB } = require('./config/database');
const { corsMiddleware } = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const apiRoutes = require('./routes');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(corsMiddleware);

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    if (config.NODE_ENV !== 'production') {
      // Only start Express server in development
      const server = app.listen(config.PORT, config.HOST, () => {
        console.log(`🚀 Server running on ${config.HOST}:${config.PORT}`);
        console.log(`🌍 Environment: ${config.NODE_ENV}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export app for Vercel
module.exports = app;

// Start server if not in Vercel environment
if (require.main === module) {
  startServer();
}

