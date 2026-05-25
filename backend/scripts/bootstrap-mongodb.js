const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Division = require('../models/Division');
const Tour = require('../models/Tour');
const Trip = require('../models/Trip');
const HomepageContent = require('../models/HomepageContent');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:salman1122@ajltours.ozyldk7.mongodb.net/AJLTours?appName=AJLTours';

async function bootstrapMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully.');

    // Create admin user
    console.log('Creating admin account...');
    const adminEmail = 'admin@tripgo.com';
    const adminPassword = 'admin123';
    
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

    // Create sample divisions
    console.log('Creating sample divisions...');
    const divisions = [
      {
        name: 'Adventure Tours',
        description: 'Exciting adventure tours for thrill seekers',
        bannerImage: 'https://example.com/adventure-banner.jpg'
      },
      {
        name: 'Cultural Tours',
        description: 'Explore rich cultural heritage and traditions',
        bannerImage: 'https://example.com/cultural-banner.jpg'
      },
      {
        name: 'Nature Tours',
        description: 'Discover the beauty of nature and wildlife',
        bannerImage: 'https://example.com/nature-banner.jpg'
      }
    ];

    for (const divisionData of divisions) {
      let division = await Division.findOne({ name: divisionData.name });
      if (!division) {
        division = new Division(divisionData);
        await division.save();
        console.log(`Created division: ${divisionData.name}`);
      }
    }

    // Create sample tours
    console.log('Creating sample tours...');
    const adventureDivision = await Division.findOne({ name: 'Adventure Tours' });
    const culturalDivision = await Division.findOne({ name: 'Cultural Tours' });
    
    const tours = [
      {
        division: adventureDivision._id,
        name: 'Mountain Hiking Adventure',
        description: 'A challenging 3-day hiking tour through mountain trails',
        price: 299.99,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-03'),
        startLocation: 'Mountain Base Camp',
        endLocation: 'Mountain Peak',
        routeDetails: 'Trail through scenic mountain paths',
        minTicketsPerBooking: 1,
        maxTotalTickets: 20,
        images: ['https://example.com/mountain1.jpg', 'https://example.com/mountain2.jpg']
      },
      {
        division: culturalDivision._id,
        name: 'Historic City Tour',
        description: 'Explore ancient monuments and cultural sites',
        price: 149.99,
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-15'),
        startLocation: 'City Center',
        endLocation: 'Historic District',
        routeDetails: 'Walking tour through historic landmarks',
        minTicketsPerBooking: 2,
        maxTotalTickets: 30,
        images: ['https://example.com/historic1.jpg', 'https://example.com/historic2.jpg']
      }
    ];

    for (const tourData of tours) {
      let tour = await Tour.findOne({ name: tourData.name });
      if (!tour) {
        tour = new Tour(tourData);
        await tour.save();
        console.log(`Created tour: ${tourData.name}`);
      }
    }

    // Create sample trips
    console.log('Creating sample trips...');
    const trips = [
      {
        name: 'Weekend Getaway',
        price: 199.99,
        description: 'A relaxing weekend trip to scenic locations'
      },
      {
        name: 'Day Trip Adventure',
        price: 89.99,
        description: 'Exciting day-long adventure activities'
      }
    ];

    for (const tripData of trips) {
      let trip = await Trip.findOne({ name: tripData.name });
      if (!trip) {
        trip = new Trip(tripData);
        await trip.save();
        console.log(`Created trip: ${tripData.name}`);
      }
    }

    // Create homepage content settings
    console.log('Creating homepage content settings...');
    const checkoutSettings = {
      'mountain-hiking': {
        minTickets: 1,
        maxTotal: 20
      },
      'historic-city': {
        minTickets: 2,
        maxTotal: 30
      }
    };

    let settings = await HomepageContent.findOne({ section: 'checkout_settings' });
    if (!settings) {
      settings = new HomepageContent({
        section: 'checkout_settings',
        content: checkoutSettings
      });
      await settings.save();
      console.log('Created checkout settings.');
    }

    console.log('\n=== Bootstrap Complete ===');
    console.log('Admin Credentials:');
    console.log('  Email: admin@tripgo.com');
    console.log('  Password: admin123');
    console.log('\nSample data created:');
    console.log('- 3 Divisions');
    console.log('- 2 Tours');
    console.log('- 2 Trips');
    console.log('- Checkout settings');
    
    process.exit(0);
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

bootstrapMongoDB();


