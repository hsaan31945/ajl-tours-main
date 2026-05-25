const config = require('../lib/config');
const { connectDB } = require('../lib/db');
const Tour = require('../models/Tour');
const Division = require('../models/Division');
const mongoose = require('mongoose');

// Hardcoded tours data
const { hardcodedTours } = require('../data/migrate-tours-data');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.cors?.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  
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
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection not ready. State: ' + mongoose.connection.readyState);
    }

    // Create or get Switzerland division
    let switzerlandDivision = await Division.findOne({ name: 'Switzerland' });
    if (!switzerlandDivision) {
      switzerlandDivision = new Division({
        name: 'Switzerland',
        description: 'Tours in Switzerland',
        isActive: true
      });
      await switzerlandDivision.save();
    }

    const results = [];
    for (const tourData of hardcodedTours) {
      try {
        let existingTour = await Tour.findById(tourData.id);
        if (!existingTour) {
          existingTour = await Tour.findOne({ name: tourData.name });
        }

        const tourPayload = {
          division: switzerlandDivision._id,
          name: tourData.name,
          description: tourData.description || '',
          overview: tourData.description || '',
          price: tourData.price,
          startLocation: tourData.address || 'Zurich Main Station, Zurich, Switzerland',
          endLocation: tourData.address || 'Zurich Main Station, Zurich, Switzerland',
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          images: tourData.images || [],
          itinerary: [],
          highlights: [],
          included: [],
          excluded: [],
          minTicketsPerBooking: 1,
          maxTotalTickets: null,
          isActive: true,
          metadata: {
            features: tourData.features || [],
            rating: tourData.rating || 4.9,
            reviews: tourData.reviews || 0,
            address: tourData.address
          }
        };

        if (existingTour) {
          Object.assign(existingTour, tourPayload);
          await existingTour.save();
          results.push({ action: 'updated', name: tourData.name, id: existingTour._id.toString() });
        } else {
          const newTour = new Tour(tourPayload);
          await newTour.save();
          results.push({ action: 'created', name: tourData.name, id: newTour._id.toString() });
        }
      } catch (tourError) {
        console.error(`Error processing tour ${tourData.name}:`, tourError);
        results.push({ action: 'error', name: tourData.name, error: tourError.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully migrated ${results.length} tours to database`,
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: config.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};
