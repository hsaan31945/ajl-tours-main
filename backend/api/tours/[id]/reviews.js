/**
 * Vercel Serverless Function - Tour reviews
 */
const { connectDB } = require('../../../src/config/database');
const { setCORSHeaders } = require('../../../src/middleware/cors');
const tourController = require('../../../src/controllers/tourController');
const { errorHandler } = require('../../../src/middleware/errorHandler');

module.exports = async (req, res) => {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const id = req.query.id || req.url.match(/\/tours\/([^/?]+)\/reviews/)?.[1];
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Tour ID is required'
      });
    }

    req.params = { id };

    if (req.method === 'POST') {
      await tourController.addTourReview(req, res, (err) => {
        if (err) errorHandler(err, req, res);
      });
      return;
    }

    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};
