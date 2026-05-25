const config = require('../lib/config');
const { connectDB } = require('../lib/db');
const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Division = require('../models/Division');
const Tour = require('../models/Tour');
const Trip = require('../models/Trip');
const HomepageContent = require('../models/HomepageContent');
const Booking = require('../models/Booking');
const TourHighlight = require('../models/TourHighlight');
const TourIncluded = require('../models/TourIncluded');
const TourExcluded = require('../models/TourExcluded');
const TourItinerary = require('../models/TourItinerary');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.cors?.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  
  // Log request for debugging
  console.log('=== DATABASE BOOTSTRAP START ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      received: req.method,
      expected: 'POST'
    });
  }

  try {
    // Check admin passcode
    const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
    const expected = process.env.ADMIN_PASSCODE || 'admin123';
    const headerTrimmed = header ? header.trim() : null;
    const expectedTrimmed = expected ? expected.trim() : null;
    if (!headerTrimmed || headerTrimmed !== expectedTrimmed) {
      return res.status(401).json({ message: 'Invalid or missing admin passcode' });
    }

    // Database connection
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready. State: ' + mongoose.connection.readyState);
    }
    
    console.log('✅ Database connected');
    console.log('Database name:', mongoose.connection.name);

    const results = {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.name,
      collections: {},
      created: [],
      errors: []
    };

    // 1. Create Switzerland Division (required for tours)
    console.log('📝 Creating Switzerland division...');
    try {
      let switzerlandDivision = await Division.findOne({ name: 'Switzerland' });
      if (!switzerlandDivision) {
        switzerlandDivision = new Division({
          name: 'Switzerland',
          description: 'Tours in Switzerland - Experience the beauty of the Swiss Alps, charming villages, and stunning landscapes',
          isActive: true
        });
        await switzerlandDivision.save();
        results.created.push({ type: 'Division', name: 'Switzerland', id: switzerlandDivision._id.toString() });
        console.log('✅ Created Switzerland division');
      } else {
        results.collections.Division = 'exists';
        console.log('✅ Switzerland division already exists');
      }
    } catch (error) {
      results.errors.push({ type: 'Division', error: error.message });
      console.error('❌ Error creating division:', error);
    }

    // 2. Create Admin User
    console.log('📝 Creating admin user...');
    try {
      const adminEmail = 'admin@ajltours.com';
      let admin = await Admin.findOne({ email: adminEmail });
      if (!admin) {
        admin = new Admin({
          username: 'admin',
          email: adminEmail,
          password: 'admin123', // Will be hashed by pre-save hook
          role: 'admin',
          isActive: true
        });
        await admin.save();
        results.created.push({ type: 'Admin', email: adminEmail, id: admin._id.toString() });
        console.log('✅ Created admin user');
      } else {
        results.collections.Admin = 'exists';
        console.log('✅ Admin user already exists');
      }
    } catch (error) {
      results.errors.push({ type: 'Admin', error: error.message });
      console.error('❌ Error creating admin:', error);
    }

    // 3. Create Homepage Content Settings
    console.log('📝 Creating homepage content...');
    try {
      let checkoutSettings = await HomepageContent.findOne({ section: 'checkout_settings' });
      if (!checkoutSettings) {
        checkoutSettings = new HomepageContent({
          section: 'checkout_settings',
          content: {
            default: {
              minTickets: 1,
              maxTotal: null
            }
          },
          isActive: true
        });
        await checkoutSettings.save();
        results.created.push({ type: 'HomepageContent', section: 'checkout_settings' });
        console.log('✅ Created checkout settings');
      } else {
        results.collections.HomepageContent = 'exists';
        console.log('✅ Homepage content already exists');
      }
    } catch (error) {
      results.errors.push({ type: 'HomepageContent', error: error.message });
      console.error('❌ Error creating homepage content:', error);
    }

    // 4. Verify all collections exist (MongoDB creates them automatically on first insert)
    console.log('📋 Verifying collections...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    results.collections.found = collectionNames;
    results.collections.count = collectionNames.length;

    // List all expected collections
    const expectedCollections = [
      'users',
      'admins',
      'divisions',
      'tours',
      'bookings',
      'trips',
      'homepagecontents',
      'tourhighlights',
      'tourincludeds',
      'tourexcludeds',
      'touritineraries'
    ];

    results.collections.expected = expectedCollections;
    results.collections.missing = expectedCollections.filter(name => !collectionNames.includes(name));

    console.log('✅ Collections verified');
    console.log('Found collections:', collectionNames.length);
    console.log('Missing collections:', results.collections.missing.length);

    // 5. Get counts
    const counts = {
      users: await User.countDocuments(),
      admins: await Admin.countDocuments(),
      divisions: await Division.countDocuments(),
      tours: await Tour.countDocuments(),
      bookings: await Booking.countDocuments(),
      trips: await Trip.countDocuments(),
      homepageContent: await HomepageContent.countDocuments()
    };

    results.counts = counts;

    console.log('\n=== BOOTSTRAP COMPLETE ===');
    console.log('Created:', results.created.length, 'items');
    console.log('Errors:', results.errors.length);
    console.log('Collections:', results.collections.count);
    console.log('Counts:', counts);

    return res.status(200).json({
      success: true,
      message: 'Database bootstrap completed successfully',
      ...results,
      summary: {
        itemsCreated: results.created.length,
        errors: results.errors.length,
        collectionsFound: results.collections.count,
        collectionsMissing: results.collections.missing.length
      }
    });

  } catch (error) {
    console.error('=== BOOTSTRAP ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');
    
    return res.status(500).json({
      success: false,
      error: 'Bootstrap failed',
      message: error.message,
      details: config.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
};


