/**
 * Vercel Serverless Function - Auth
 */
const { connectDB } = require('../../src/config/database');
const { setCORSHeaders } = require('../../src/middleware/cors');
const authController = require('../../src/controllers/authController');
const { errorHandler } = require('../../src/middleware/errorHandler');

module.exports = async (req, res) => {
  setCORSHeaders(req, res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    await connectDB();
    
    // Parse body
    if (!req.body) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyStr = Buffer.concat(chunks).toString() || '{}';
      try {
        req.body = JSON.parse(bodyStr);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON in request body'
        });
      }
    }
    
    const path = (req.url || '').split('?')[0];
    
    if (path.includes('/admin/login')) {
      if (req.method === 'POST') {
        await authController.adminLogin(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else if (path.includes('/admin/create')) {
      if (req.method === 'POST') {
        await authController.createAdmin(req, res, (err) => {
          if (err) errorHandler(err, req, res);
        });
      } else {
        res.status(405).json({ success: false, error: 'Method not allowed' });
      }
    } else {
      res.status(404).json({ success: false, error: 'Route not found' });
    }
  } catch (error) {
    errorHandler(error, req, res);
  }
};





