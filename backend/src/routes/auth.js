/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { corsMiddleware } = require('../middleware/cors');

router.use(corsMiddleware);

router.post('/admin/login', authController.adminLogin.bind(authController));
router.post('/admin/create', authController.createAdmin.bind(authController));

module.exports = router;





