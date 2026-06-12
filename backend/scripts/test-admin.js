const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const testAdmin = async () => {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    const adminPassword = process.env.ADMIN_TEST_PASSWORD || process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSCODE;
    if (!adminPassword) {
      throw new Error('ADMIN_TEST_PASSWORD, ADMIN_BOOTSTRAP_PASSWORD, or ADMIN_PASSCODE is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const admin = await Admin.findOne({ email: 'admin@tripgo.com' });
    
    if (admin) {
      console.log('Admin account exists:');
      console.log('Email:', admin.email);
      console.log('Username:', admin.username);
      console.log('Is Active:', admin.isActive);
    } else {
      console.log('Admin account does not exist. Creating...');
      
      const newAdmin = new Admin({
        username: 'admin',
        email: 'admin@tripgo.com',
        password: adminPassword,
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      console.log('Admin account created successfully!');
      console.log('Email: admin@tripgo.com');
      console.log('Password: configured from environment');
    }

    // Test password comparison
    if (admin) {
      const isValid = await admin.comparePassword(adminPassword);
      console.log('Password test result:', isValid);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAdmin();


