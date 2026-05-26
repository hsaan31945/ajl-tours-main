const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Division = require('../models/Division');

const MONGODB_URI = process.env.MONGODB_URI;

async function bootstrapMongoDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }

    const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSCODE;
    if (!adminPassword) {
      throw new Error('ADMIN_BOOTSTRAP_PASSWORD or ADMIN_PASSCODE is required');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully.');

    // Create admin user
    console.log('Creating admin account...');
    const adminEmail = 'admin@tripgo.com';
    
    // Check if admin already exists
    let admin = await Admin.findOne({ email: adminEmail });
    if (admin) {
      // Update existing admin password
      admin.password = adminPassword; // Will be hashed by pre-save hook
      await admin.save();
      console.log('Admin password updated.');
    } else {
      // Create new admin
      admin = new Admin({
        username: 'admin',
        email: adminEmail,
        password: adminPassword, // Will be hashed by pre-save hook
        role: 'admin',
        isActive: true
      });
      await admin.save();
      console.log('Admin account created.');
    }

    // Create the base division only. Tours must be created by admin users and saved in MongoDB.
    console.log('Ensuring base division exists...');
    let division = await Division.findOne({ name: 'Switzerland' });
    if (!division) {
      division = new Division({
        name: 'Switzerland',
        description: 'Tours in Switzerland',
        isActive: true
      });
      await division.save();
      console.log('Created division: Switzerland');
    }

    console.log('\n=== Bootstrap Complete ===');
    console.log('Admin Credentials:');
    console.log('  Email: admin@tripgo.com');
    console.log('  Password: configured from environment');
    console.log('\nNo sample tours, trips, prices, itineraries, or checkout defaults were created.');
    
    process.exit(0);
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

bootstrapMongoDB();
