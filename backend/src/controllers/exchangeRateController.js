const exchangeRateService = require('../services/exchangeRateService');

const getExchangeRates = async (req, res, next) => {
  try {
    const forceRefresh = req.query?.refresh === 'true';
    const payload = await exchangeRateService.getExchangeRates({ forceRefresh });

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExchangeRates,
};
