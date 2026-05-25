const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const simplePasscodeAuth = require('../middleware/simplePasscodeAuth');

// Public routes
router.post('/login', adminController.adminLogin);
router.post('/create', adminController.createAdmin);

// Protected routes (require passcode)
router.get('/content/:section', simplePasscodeAuth, adminController.getHomepageContent);
router.put('/content/:section', simplePasscodeAuth, adminController.updateHomepageContent);
router.get('/content', simplePasscodeAuth, adminController.getAllHomepageContent);

module.exports = router;
