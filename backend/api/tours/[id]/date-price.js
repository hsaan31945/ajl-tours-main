const { connectDB } = require('../../../src/config/database');
const { setCORSHeaders } = require('../../../src/middleware/cors');
const { authenticateAdmin } = require('../../../src/middleware/auth');
const Tour = require('../../../models/Tour');

const requireAdmin = (req, res) => new Promise((resolve, reject) => {
  authenticateAdmin(req, res, (err) => (err ? reject(err) : resolve()));
});

const normalizeDatePrices = (datePrices) => {
  if (!datePrices) return {};
  if (datePrices instanceof Map) return Object.fromEntries(datePrices);
  if (Array.isArray(datePrices)) {
    return datePrices.reduce((acc, entry) => {
      if (!entry?.date) return acc;
      const price = Number(entry.price);
      if (Number.isFinite(price)) acc[String(entry.date)] = price;
      return acc;
    }, {});
  }
  if (typeof datePrices === 'object') {
    return Object.entries(datePrices).reduce((acc, [date, price]) => {
      const numericPrice = Number(price);
      if (date && Number.isFinite(numericPrice)) acc[date] = numericPrice;
      return acc;
    }, {});
  }
  return {};
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString() || '{}';
  return JSON.parse(raw);
};

module.exports = async (req, res) => {
  setCORSHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();

    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'Tour ID is required' });

    const tour = await Tour.findById(id);
    if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        price: tour.price,
        datePrices: normalizeDatePrices(tour.datePrices),
      });
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      await requireAdmin(req, res);
      const body = await parseBody(req);
      const { date, price, datePrices } = body;

      const nextDatePrices = datePrices !== undefined
        ? normalizeDatePrices(datePrices)
        : normalizeDatePrices(tour.datePrices);

      if (date && price !== undefined) {
        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice)) {
          return res.status(400).json({ success: false, error: 'Price must be a valid number' });
        }
        nextDatePrices[String(date)] = numericPrice;
      }

      tour.datePrices = nextDatePrices;
      await tour.save();

      return res.status(200).json({
        success: true,
        datePrices: normalizeDatePrices(tour.datePrices),
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Tour date-price API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
};
