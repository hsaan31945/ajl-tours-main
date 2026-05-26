const { connectDB } = require('../src/config/database');
const { setCORSHeaders } = require('../src/middleware/cors');
const Division = require('../models/Division');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const HomepageContent = require('../models/HomepageContent');

module.exports = async (req, res) => {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(410).json({
      success: false,
      error: 'Database bootstrap is disabled in production.',
      message: 'Create and edit records through admin APIs so MongoDB remains the only source of truth.',
    });
  }

  try {
    await connectDB();

    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy. Bootstrap writes are disabled.',
      counts: {
        divisions: await Division.countDocuments(),
        tours: await Tour.countDocuments(),
        activeTours: await Tour.countDocuments({ isActive: { $ne: false } }),
        bookings: await Booking.countDocuments(),
        homepageContent: await HomepageContent.countDocuments(),
      },
    });
  } catch (error) {
    console.error('Database status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database status check failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
};
