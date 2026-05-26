/**
 * Authentication Middleware
 * JWT token verification with passcode fallback (deprecated)
 */
const authService = require('../services/authService');
const { AppError } = require('./errorHandler');

/**
 * Primary authentication - JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Attach user info to request
    req.user = decoded;
    req.userId = decoded.id;
    req.isAuthenticated = true;
    req.authMethod = 'jwt';
    
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

/**
 * Unified auth - accepts JWT or passcode (for migration)
 * Prefers JWT, falls back to passcode
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Try JWT first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = authService.verifyToken(token);
        req.user = decoded;
        req.userId = decoded.id;
        req.isAuthenticated = true;
        req.authMethod = 'jwt';
        return next();
      } catch (tokenError) {
        // Token invalid, try passcode fallback
      }
    }
    
    // Fallback to passcode (deprecated but kept for backward compatibility)
    const header = req.headers['x-admin-passcode'] || req.headers['X-Admin-Passcode'];
    const config = require('../config');
    const expected = config.admin.passcode;
    
    if (expected && header && header.trim() === expected.trim()) {
      req.isAuthenticated = true;
      req.authMethod = 'passcode';
      req.adminActor = 'passcode-admin';
      return next();
    }
    
    return next(new AppError('Authentication required. Please provide a valid token or passcode.', 401));
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

/**
 * Simple passcode auth (deprecated - use authenticateAdmin instead)
 * @deprecated Use authenticateAdmin or authenticate instead
 */
const simplePasscodeAuth = (req, res, next) => {
  return authenticateAdmin(req, res, next);
};

module.exports = {
  authenticate,
  authenticateAdmin,
  simplePasscodeAuth
};

