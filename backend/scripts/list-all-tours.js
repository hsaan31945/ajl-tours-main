const Tour = require('../models/Tour');
const Division = require('../models/Division');
const mongoose = require('mongoose');
require('dotenv').config();

// Use the correct environment variable name as set in Vercel
if (process.env.AD) {
  process.env.ADMIN_PASSCODE = process.env.AD;
}

async function listAllTours() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours');
    
    console.log('Connected. Finding all tours...');
    
    const tours = await Tour.find({});
    console.log(`Found ${tours.length} tours total`);
    
    tours.forEach((tour, index) => {
      console.log(`${index + 1}. Tour ID: ${tour._id.toString()}`);
      console.log(`   Name: ${tour.name}`);
      console.log(`   Start Location: ${tour.startLocation}`);
      console.log(`   Price: ${tour.price}`);
      console.log(`   Division ID: ${tour.division}`);
      console.log('');
    });
    
    // Also check if there are any tours with Switzerland division
    console.log('Checking for tours with Switzerland division...');
    const switzerlandDivision = await Division.findOne({ name: 'Switzerland' });
    if (switzerlandDivision) {
      console.log(`Switzerland division found with ID: ${switzerlandDivision._id}`);
      const swissTours = await Tour.find({ division: switzerlandDivision._id });
      console.log(`Found ${swissTours.length} tours in Switzerland division`);
      swissTours.forEach((tour, index) => {
        console.log(`${index + 1}. Swiss Tour ID: ${tour._id.toString()}`);
        console.log(`   Name: ${tour.name}`);
        console.log(`   Start Location: ${tour.startLocation}`);
        console.log('');
      });
    } else {
      console.log('No Switzerland division found');
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listAllTours();