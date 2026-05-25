const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');

// Public routes for content access
router.get('/homepage/:section', contentController.getPublicHomepageContent);
router.get('/homepage', contentController.getAllPublicHomepageContent);

module.exports = router;




