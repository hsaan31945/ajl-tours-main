const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const testAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours');
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
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      
      await newAdmin.save();
      console.log('Admin account created successfully!');
      console.log('Email: admin@tripgo.com');
      console.log('Password: admin123');
    }

    // Test password comparison
    if (admin) {
      const isValid = await admin.comparePassword('admin123');
      console.log('Password test result:', isValid);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testAdmin();




