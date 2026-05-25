/**
 * Auth Controller
 */
const authService = require('../services/authService');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  async adminLogin(req, res, next) {
    try {
      const { password } = req.body;
      const result = await authService.adminLogin(password);
      res.json(result);
    } catch (error) {
      if (error.message === 'Invalid password' || error.message === 'Invalid credentials') {
        return next(new AppError('Invalid password', 401));
      }
      if (error.message === 'No active admin accounts found') {
        return next(new AppError('No active admin accounts found', 404));
      }
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const admin = await authService.createAdmin(req.body);
      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        admin
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return next(new AppError(error.message, 409));
      }
      next(error);
    }
  }
}

module.exports = new AuthController();


