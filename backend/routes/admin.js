const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../src/middleware/auth');

// Public routes
router.post('/login', adminController.adminLogin);
router.post('/create', adminController.createAdmin);

// Protected routes
router.get('/content/:section', authenticateAdmin, adminController.getHomepageContent);
router.put('/content/:section', authenticateAdmin, adminController.updateHomepageContent);
router.get('/content', authenticateAdmin, adminController.getAllHomepageContent);

module.exports = router;
