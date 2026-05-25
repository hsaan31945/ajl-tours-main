const mongoose = require('mongoose');

// Cache the database connection across serverless invocations
// to avoid creating multiple connections.
let cached = global.__tripgo_mongoose;
if (!cached) {
  cached = { conn: null, promise: null };
  global.__tripgo_mongoose = cached;
}

// Helper function to wait for connection to be ready
const waitForConnection = (maxWaitTime = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkConnection = () => {
      const state = mongoose.connection.readyState;
      // State 1 = connected, State 2 = connecting
      if (state === 1) {
        resolve(mongoose.connection);
        return;
      }
      
      if (Date.now() - startTime > maxWaitTime) {
        reject(new Error(`Connection timeout. State: ${state} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`));
        return;
      }
      
      // Check again in 100ms
      setTimeout(checkConnection, 100);
    };
    
    // If already connected, resolve immediately
    if (mongoose.connection.readyState === 1) {
      resolve(mongoose.connection);
      return;
    }
    
    // Start checking
    checkConnection();
  });
};

// MongoDB connection configuration with serverless-friendly caching
const connectDB = async () => {
  try {
    // If already connected, return immediately
    if (cached.conn && mongoose.connection.readyState === 1) {
      return cached.conn;
    }

    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours';
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not set');
      throw new Error('MONGODB_URI environment variable is not set. Please set it in environment variables.');
    }

    console.log('🔌 Connecting to MongoDB...');
    console.log('MongoDB URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    console.log('Current connection state:', mongoose.connection.readyState);

    // If connection is in progress, wait for it
    if (cached.promise && mongoose.connection.readyState === 2) {
      console.log('⏳ Connection in progress, waiting...');
      cached.conn = await cached.promise;
      await waitForConnection();
      return cached.conn;
    }

    // Start new connection if not already connecting
    if (!cached.promise) {
      cached.promise = mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
      }).then(async (mongooseInstance) => {
        console.log(`✅ MongoDB Connected: ${mongooseInstance.connection.host}`);
        console.log(`Database: ${mongooseInstance.connection.name}`);
        console.log(`Connection state: ${mongooseInstance.connection.readyState}`);
        
        // Wait for connection to be fully ready
        await waitForConnection();
        
        return mongooseInstance;
      }).catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        cached.promise = null; // Reset promise on error
        throw error;
      });
    }

    cached.conn = await cached.promise;
    
    // Double-check connection is ready
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Connection not ready after promise, waiting...');
      await waitForConnection();
    }
    
    console.log('✅ Database connection verified and ready');
    return cached.conn;
  } catch (error) {
    console.error('=== MONGODB CONNECTION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('MONGODB_URI set:', !!process.env.MONGODB_URI);
    console.error('MongoDB URI (masked):', process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'NOT SET');
    console.error('Connection state:', mongoose.connection.readyState);
    console.error('================================');
    
    // Reset cache on error
    cached.conn = null;
    cached.promise = null;
    
    throw error;
  }
};

// Import all models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Division = require('../models/Division');
const Trip = require('../models/Trip');
const HomepageContent = require('../models/HomepageContent');

module.exports = {
  connectDB,
  models: {
    User,
    Admin,
    Booking,
    Tour,
    Division,
    Trip,
    HomepageContent
  }
};
