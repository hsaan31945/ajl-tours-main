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

function setDynamicHeroCacheHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
}

function sanitizeImageUrl(value, { allowDataImage = false } = {}) {
  const url = String(value || '').trim();
  if (!url) return '';

  if (/^data:/i.test(url)) {
    const isSupportedImage = /^data:image\/(?:webp|avif);base64,/i.test(url);
    return allowDataImage && isSupportedImage && url.length <= 500000 ? url : '';
  }

  if (url.length > 2000) return '';
  return url;
}

function sanitizeHeroImages(value) {
  const images = Array.isArray(value) ? value : [];
  return images
    .map((image) => {
      if (typeof image === 'string') return sanitizeImageUrl(image, { allowDataImage: true });
      return sanitizeImageUrl(image?.url || image?.imageUrl || image?.src, { allowDataImage: true });
    })
    .filter(Boolean)
    .slice(0, 4);
}

function sanitizeHeroBannerContent(content = {}) {
  return Object.entries(content || {}).reduce((acc, [pageKey, banner]) => {
    if (!banner || typeof banner !== 'object') return acc;

    const images = sanitizeHeroImages(banner.images);
    const imageUrl = sanitizeImageUrl(banner.imageUrl || images[0], { allowDataImage: true });

    acc[pageKey] = {
      imageUrl: imageUrl || images[0] || '',
      images: images.length ? images : [imageUrl].filter(Boolean),
      alt: String(banner.alt || '').slice(0, 160),
      title: String(banner.title || '').slice(0, 160),
      subtitle: String(banner.subtitle || '').slice(0, 260),
      buttonText: String(banner.buttonText || banner.ctaText || '').slice(0, 80),
      buttonLink: String(banner.buttonLink || banner.ctaLink || '').slice(0, 400),
    };

    return acc;
  }, {});
}

function sanitizePublicHomepageDoc(doc) {
  if (!doc) return doc;
  if (doc.section !== 'hero_banners') return doc;
  return {
    ...doc,
    content: sanitizeHeroBannerContent(doc.content),
  };
}

async function getPublicHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const isHeroBanners = section === 'hero_banners';
    const cacheKey = `section:${section}`;
    const cached = isHeroBanners ? null : getCache(cacheKey);
    if (cached) {
      setPublicCacheHeaders(res);
      return res.json(cached);
    }

    const doc = await HomepageContent
      .findOne({ section, isActive: true })
      .select('section content updatedAt')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Section not found' });
    const publicDoc = sanitizePublicHomepageDoc(doc);
    if (isHeroBanners) {
      setDynamicHeroCacheHeaders(res);
    } else {
      setCache(cacheKey, publicDoc);
      setPublicCacheHeaders(res);
    }
    return res.json(publicDoc);
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
    const publicItems = items.map(sanitizePublicHomepageDoc);
    setCache(cacheKey, publicItems);
    setPublicCacheHeaders(res);
    return res.json(publicItems);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getPublicHomepageContent,
  getAllPublicHomepageContent,
  clearHomepageContentCache,
  sanitizeHeroBannerContent,
};
