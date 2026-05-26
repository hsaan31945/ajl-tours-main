const { connectDB } = require('../src/config/database');
const { setCORSHeaders } = require('../src/middleware/cors');
const Tour = require('../models/Tour');

module.exports = async (req, res) => {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(410).json({
      success: false,
      error: 'Legacy tour migration/update endpoint is disabled.',
      message: 'Tour data is edited only through /api/tours and persisted directly in MongoDB.',
    });
  }

  try {
    await connectDB();
    const totalTours = await Tour.countDocuments({});
    const activeTours = await Tour.countDocuments({ isActive: { $ne: false } });

    return res.status(200).json({
      success: true,
      message: 'MongoDB tour persistence is active. Legacy migration actions are disabled.',
      totalTours,
      activeTours,
    });
  } catch (error) {
    console.error('Tour data status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
};
