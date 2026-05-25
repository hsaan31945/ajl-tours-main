/**
 * Unified CORS Middleware
 * Works for both Express and Vercel serverless functions
 */
const config = require('../config');

const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin || req.headers.Origin || '';
  
  // Check if origin is allowed
  const allowedOrigin = config.cors.origins.includes(origin) 
    ? origin 
    : config.cors.origins[0]; // Default to production frontend
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials ? 'true' : 'false');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (next) next();
};

// For Vercel serverless functions (no next parameter)
const setCORSHeaders = (req, res) => {
  const origin = req.headers.origin || req.headers.Origin || '';
  const allowedOrigin = config.cors.origins.includes(origin) 
    ? origin 
    : config.cors.origins[0];
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Passcode');
  res.setHeader('Access-Control-Allow-Credentials', config.cors.credentials ? 'true' : 'false');
  res.setHeader('Access-Control-Max-Age', '86400');
};

module.exports = {
  corsMiddleware,
  setCORSHeaders
};





