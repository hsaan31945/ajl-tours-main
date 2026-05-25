/**
 * Auth Service
 * Business logic for authentication
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../../models/Admin');
const config = require('../config');

class AuthService {
  /**
   * Admin login - Password only
   */
  async adminLogin(password) {
    if (!password) {
      throw new Error('Password is required');
    }
    
    // Find all active admins and check password
    const admins = await Admin.find({ isActive: true });
    
    if (admins.length === 0) {
      throw new Error('No active admin accounts found');
    }
    
    // Try to find admin with matching password
    let authenticatedAdmin = null;
    for (const admin of admins) {
      const isPasswordValid = await admin.comparePassword(password);
      if (isPasswordValid) {
        authenticatedAdmin = admin;
        break;
      }
    }
    
    if (!authenticatedAdmin) {
      throw new Error('Invalid password');
    }
    
    // Update last login
    authenticatedAdmin.lastLogin = new Date();
    await authenticatedAdmin.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: authenticatedAdmin._id,
        username: authenticatedAdmin.username,
        role: 'admin'
      },
      config.admin.jwtSecret,
      { expiresIn: config.admin.jwtExpiresIn }
    );
    
    return {
      success: true,
      token,
      admin: {
        id: authenticatedAdmin._id,
        username: authenticatedAdmin.username
      }
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.admin.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create admin user
   */
  async createAdmin(adminData) {
    const { username, email, password } = adminData;
    
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });
    
    if (existingAdmin) {
      throw new Error('Admin with this email or username already exists');
    }
    
    // Create admin (password will be hashed by pre-save hook)
    const admin = new Admin({
      username,
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save hook
      isActive: true
    });
    
    await admin.save();
    
    return {
      id: admin._id,
      username: admin.username,
      email: admin.email
    };
  }
}

module.exports = new AuthService();

