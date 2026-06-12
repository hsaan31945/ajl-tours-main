const HomepageContent = require('../models/HomepageContent');

const HOMEPAGE_CACHE_TTL_MS = 10 * 60 * 1000;
const homepageCache = new Map();

function getCache(key) {
  const item = homepageCache.get(key);
  if (!item || item.expiresAt <= Date.now()) {
    homepageCache.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value) {
  homepageCache.set(key, {
    value,
    expiresAt: Date.now() + HOMEPAGE_CACHE_TTL_MS,
  });
}

function clearHomepageContentCache() {
  homepageCache.clear();
}

function setPublicCacheHeaders(res) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
}

async function getPublicHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const cacheKey = `section:${section}`;
    const cached = getCache(cacheKey);
    if (cached) {
      setPublicCacheHeaders(res);
      return res.json(cached);
    }

    const doc = await HomepageContent
      .findOne({ section, isActive: true })
      .select('section content updatedAt')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Section not found' });
    setCache(cacheKey, doc);
    setPublicCacheHeaders(res);
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAllPublicHomepageContent(req, res) {
  try {
    const cacheKey = 'all';
    const cached = getCache(cacheKey);
    if (cached) {
      setPublicCacheHeaders(res);
      return res.json(cached);
    }

    const items = await HomepageContent
      .find({ isActive: true })
      .select('section content updatedAt')
      .sort({ section: 1 })
      .lean();
    setCache(cacheKey, items);
    setPublicCacheHeaders(res);
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getPublicHomepageContent,
  getAllPublicHomepageContent,
  clearHomepageContentCache,
};
