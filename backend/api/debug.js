
module.exports = async (req, res) => {
  try {
    const { connectDB } = require('../src/config/database');
    const config = require('../src/config/index');
    
    res.json({
      message: 'Debug endpoint is working',
      env: process.env.NODE_ENV,
      mongoConfigured: !!config.mongodb.uri,
      query: req.query,
      url: req.url
    });
  } catch (err) {
    res.status(500).json({
      error: 'Debug endpoint failed',
      message: err.message,
      stack: err.stack
    });
  }
};
