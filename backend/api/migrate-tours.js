const config = require('../lib/config');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', config.cors?.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(410).json({
    success: false,
    message: 'Hardcoded tour migration is disabled. MongoDB tours are the only source of truth.'
  });
};
