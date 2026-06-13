const express = require('express');
const exchangeRateController = require('../controllers/exchangeRateController');

const router = express.Router();

router.get('/', exchangeRateController.getExchangeRates);

module.exports = router;
