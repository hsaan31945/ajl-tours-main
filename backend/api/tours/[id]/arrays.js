const { connectDB } = require('../../../src/config/database');
const { setCORSHeaders } = require('../../../src/middleware/cors');
const { authenticateAdmin } = require('../../../src/middleware/auth');
const Tour = require('../../../models/Tour');

const VALID_FIELDS = ['highlights', 'included', 'excluded', 'itinerary'];

const requireAdmin = (req, res) => new Promise((resolve, reject) => {
  authenticateAdmin(req, res, (err) => (err ? reject(err) : resolve()));
});

const cleanTextArray = (items) => (
  Array.isArray(items)
    ? items.map((item) => String(item || '').trim()).filter(Boolean)
    : []
);

const cleanItinerary = (items) => (
  Array.isArray(items)
    ? items
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const normalized = {
            title: item.title ? String(item.title).trim() : undefined,
            description: item.description ? String(item.description).trim() : undefined,
            duration: item.duration ? String(item.duration).trim() : undefined,
            location: item.location ? String(item.location).trim() : undefined,
            type: item.type ? String(item.type).trim() : undefined,
            activities: cleanTextArray(item.activities),
          };
          Object.keys(normalized).forEach((key) => {
            if (
              normalized[key] === undefined ||
              (Array.isArray(normalized[key]) && normalized[key].length === 0)
            ) {
              delete normalized[key];
            }
          });
          return Object.keys(normalized).length ? normalized : null;
        })
        .filter(Boolean)
    : []
);

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

    const { id, field } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'Tour ID is required' });
    if (!VALID_FIELDS.includes(field)) {
      return res.status(400).json({
        success: false,
        error: `Invalid field. Expected one of: ${VALID_FIELDS.join(', ')}`,
      });
    }

    const tour = await Tour.findById(id);
    if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

    if (req.method === 'GET') {
      return res.status(200).json({ success: true, [field]: tour[field] || [] });
    }

    await requireAdmin(req, res);
    const body = await parseBody(req);

    if (req.method === 'PUT') {
      const nextValue = field === 'itinerary'
        ? cleanItinerary(body[field])
        : cleanTextArray(body[field]);

      tour[field] = nextValue;
      await tour.save();
      return res.status(200).json({ success: true, [field]: tour[field] || [] });
    }

    if (req.method === 'POST') {
      const current = Array.isArray(tour[field]) ? tour[field] : [];
      const item = field === 'itinerary'
        ? cleanItinerary([body.item])[0]
        : cleanTextArray([body.value])[0];

      if (!item) return res.status(400).json({ success: false, error: 'Item is empty' });
      tour[field] = [...current, item];
      await tour.save();
      return res.status(200).json({ success: true, [field]: tour[field] || [] });
    }

    if (req.method === 'DELETE') {
      const current = Array.isArray(tour[field]) ? tour[field] : [];
      const index = Number(body.index);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return res.status(400).json({ success: false, error: 'Valid item index is required' });
      }
      tour[field] = current.filter((_, itemIndex) => itemIndex !== index);
      await tour.save();
      return res.status(200).json({ success: true, [field]: tour[field] || [] });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Tour arrays API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
};
