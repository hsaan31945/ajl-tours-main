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
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
}

function setDynamicHeroCacheHeaders(res) {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400');
  res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
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

function getHeroImageEndpoint(pageKey, imageIndex = 0) {
  const query = new URLSearchParams({
    page: String(pageKey || ''),
    index: String(Math.max(0, Number(imageIndex) || 0)),
  });
  return `/api/content/homepage/hero_banners/image?${query.toString()}`;
}

function replaceHeroDataImagesWithUrls(content = {}) {
  return Object.entries(content || {}).reduce((acc, [pageKey, banner]) => {
    if (!banner || typeof banner !== 'object') return acc;

    const sourceImages = Array.isArray(banner.images)
      ? banner.images
      : [banner.imageUrl].filter(Boolean);
    const images = sourceImages
      .map((image, index) => {
        const value = typeof image === 'string'
          ? image
          : image?.url || image?.imageUrl || image?.src || '';
        return /^data:image\//i.test(String(value || '').trim())
          ? getHeroImageEndpoint(pageKey, index)
          : sanitizeImageUrl(value);
      })
      .filter(Boolean)
      .slice(0, 4);

    acc[pageKey] = {
      ...banner,
      imageUrl: images[0] || '',
      images,
    };
    return acc;
  }, {});
}

function sanitizePublicHomepageDoc(doc) {
  if (!doc) return doc;
  if (doc.section !== 'hero_banners') return doc;
  return {
    ...doc,
    content: replaceHeroDataImagesWithUrls(sanitizeHeroBannerContent(doc.content)),
  };
}

async function getPublicHomepageImage(req, res) {
  try {
    const pageKey = String(req.query?.page || '').trim();
    const imageIndex = Math.max(0, Number(req.query?.index) || 0);
    if (!pageKey) return res.status(400).json({ message: 'Hero page is required' });

    const doc = await HomepageContent
      .findOne({ section: 'hero_banners', isActive: true })
      .select('content updatedAt')
      .lean();
    if (!doc) return res.status(404).json({ message: 'Hero banners not found' });

    const banner = doc.content?.[pageKey] || {};
    const images = Array.isArray(banner.images)
      ? banner.images
      : [banner.imageUrl].filter(Boolean);
    const rawImage = images[imageIndex];
    const image = typeof rawImage === 'string'
      ? rawImage
      : rawImage?.url || rawImage?.imageUrl || rawImage?.src || '';

    if (/^https?:\/\//i.test(image) || /^\//.test(image)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
      return res.redirect(302, image);
    }

    const match = String(image || '').match(/^data:(image\/(?:webp|avif));base64,(.+)$/i);
    if (!match) return res.status(404).json({ message: 'Hero image not found' });

    const buffer = Buffer.from(match[2], 'base64');
    res.setHeader('Content-Type', match[1].toLowerCase());
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=604800');
    if (doc.updatedAt) res.setHeader('Last-Modified', new Date(doc.updatedAt).toUTCString());
    return res.end(buffer);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getPublicHomepageContent(req, res) {
  try {
    const { section } = req.params;
    const isHeroBanners = section === 'hero_banners';
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
    const publicDoc = sanitizePublicHomepageDoc(doc);
    setCache(cacheKey, publicDoc);
    if (isHeroBanners) {
      setDynamicHeroCacheHeaders(res);
    } else {
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
  getPublicHomepageImage,
  getAllPublicHomepageContent,
  clearHomepageContentCache,
  sanitizeHeroBannerContent,
};
