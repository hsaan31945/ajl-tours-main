const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

process.env.NODE_ENV = 'development';
process.env.PUBLIC_MEDIA_BASE_URL = 'http://127.0.0.1:5174';

const workspaceRoot = path.resolve(__dirname, '..');
const tourService = require('../backend/src/services/tourService');
const { getMigratedTourImages, getTourThumbnail } = require('../backend/src/utils/tourImages');
const exportPath = path.join(
  workspaceRoot,
  'database-backups/db_export_20260519_001437/tours.json'
);
const raw = fs.readFileSync(exportPath, 'utf8').replace(/^\uFEFF/, '');
const sourceTours = JSON.parse(raw).value || [];

const details = sourceTours.map((tour) => {
  const id = String(tour._id || tour.id);
  const images = getMigratedTourImages(id);
  const normalized = {
    ...tour,
    id,
    _id: id,
    divisionName: tour.division?.name || '',
    images,
  };
  normalized.thumbnail = getTourThumbnail(normalized);
  return normalized;
});

const list = details.map((tour) => tourService.formatListTour({
  ...tour,
  imageCount: tour.images.length,
  shortSummary: String(tour.bookingSummary || tour.description || '').slice(0, 240),
}));

const sendJson = (res, payload, statusCode = 200) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:5174',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });
  res.end(JSON.stringify(payload));
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:3000');

  if (req.method === 'OPTIONS') return sendJson(res, {});
  if (url.pathname === '/api/tours') return sendJson(res, list);
  if (url.pathname.startsWith('/api/tours/')) {
    const id = decodeURIComponent(url.pathname.split('/')[3] || '');
    const tour = details.find((item) => item.id === id || item.metadata?.staticId === id);
    return tour ? sendJson(res, tour) : sendJson(res, { error: 'Tour not found' }, 404);
  }
  if (url.pathname.startsWith('/api/content/homepage/')) {
    return sendJson(res, { section: 'hero_banners', content: {} });
  }
  if (url.pathname === '/api/exchange-rates') {
    return sendJson(res, { base: 'CHF', rates: { CHF: 1, USD: 1.12, EUR: 1.04 } });
  }
  if (url.pathname === '/api/bookings') return sendJson(res, { success: true, data: [] });
  return sendJson(res, { error: 'Route not found' }, 404);
}).listen(3000, () => {
  console.log('Mock AJL API listening on http://127.0.0.1:3000');
});
