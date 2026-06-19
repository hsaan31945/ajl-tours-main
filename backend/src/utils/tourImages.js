const IMAGE_FIELDS = ['thumbnail', 'cardImage', 'coverImage', 'images', 'gallery', 'media'];
const tourMediaManifest = require('../../data/tour-media-manifest.json');

const STATIC_TOUR_IMAGE_RULES = [
  {
    keys: ['rhine falls', 'stein am rhein'],
    image: '/assets/images/Zurich_to_Rhine_Falls/Rhine1.avif',
  },
  {
    keys: ['titlis', 'engelberg'],
    image: '/assets/images/Titlis_Engelberg/Titlis1.avif',
  },
  {
    keys: ['interlaken', 'grindelwald', 'sherlock', 'reichenbach', 'aareschlucht'],
    image: '/assets/images/Interlaken_and_Grindelwald/Interlaken1.avif',
  },
  {
    keys: ['basel', 'colmar', 'france', 'museum'],
    image: '/assets/images/Basel_and_Colmar/Basel1.avif',
  },
  {
    keys: ['appenzell', 'st. gallen', 'st gallen'],
    image: '/assets/images/Appenzell_Day_Tour/Appenzell1.avif',
  },
  {
    keys: ['crash landing'],
    image: '/assets/images/Crash_Landing/Crash_Landing1.avif',
  },
  {
    keys: ['lucerne', 'luzern'],
    image: '/assets/images/Lucerne/Lucerne1.avif',
  },
  {
    keys: ['liechtenstein', 'vaduz', 'heidiland', 'landquart', 'lindt', 'walensee', 'austria', 'germany', '4 countries', '4-country'],
    image: '/assets/images/Switzerland/Zurich1.avif',
  },
  {
    keys: ['zurich', 'zürich', 'switzerland'],
    image: '/assets/images/Switzerland/Zurich1.avif',
  },
];

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const isDataImage = (value) => /^data:image\//i.test(String(value || '').trim());

const isImageUrl = (value) => {
  const text = String(value || '').trim();
  return Boolean(text) && !isDataImage(text) && /^(https?:\/\/|\/|\.\/)/i.test(text);
};

const readImageValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return isImageUrl(value) ? value.trim() : '';
  if (typeof value === 'object') {
    return readImageValue(value.url || value.secure_url || value.src || value.path || value.imageUrl);
  }
  return '';
};

const firstImageValue = (value) => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const image = readImageValue(item);
      if (image) return image;
    }
    return '';
  }
  return readImageValue(value);
};

const hasDataImageValue = (value) => {
  if (!value) return false;
  if (Array.isArray(value)) return value.some(hasDataImageValue);
  if (typeof value === 'string') return isDataImage(value);
  if (typeof value === 'object') {
    return hasDataImageValue(value.url || value.secure_url || value.src || value.path || value.imageUrl);
  }
  return false;
};

const getTourId = (tour = {}) => tour._id?.toString?.() || tour.id || '';

const getMediaBaseUrl = () => {
  const configured = String(
    process.env.PUBLIC_MEDIA_BASE_URL ||
    process.env.FRONTEND_URL ||
    ''
  ).trim().replace(/\/$/, '');

  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? 'https://ajltour.com' : '';
};

const makePublicMediaUrl = (value) => {
  const url = String(value || '').trim();
  if (!url || /^https?:\/\//i.test(url)) return url;
  const normalized = url.startsWith('/') ? url : `/${url}`;
  const base = getMediaBaseUrl();
  return base ? `${base}${normalized}` : normalized;
};

const getMigratedTourImages = (tourOrId = {}) => {
  const id = typeof tourOrId === 'object' ? getTourId(tourOrId) : String(tourOrId || '');
  const images = tourMediaManifest[id];
  return Array.isArray(images) ? images.map(makePublicMediaUrl) : [];
};

const getTourImageEndpoint = (tour = {}, index = 0) => {
  const id = getTourId(tour);
  if (!id) return '';
  const suffix = Number(index) > 0 ? `?index=${encodeURIComponent(String(index))}` : '';
  return `/api/tours/${encodeURIComponent(String(id))}/image${suffix}`;
};

const getStaticTourThumbnail = (tour = {}) => {
  const haystack = normalizeText([
    tour.name,
    tour.title,
    tour.description,
    tour.destination,
    tour.location,
    tour.startLocation,
    tour.divisionName,
    tour.metadata?.staticId,
  ].filter(Boolean).join(' '));

  const match = STATIC_TOUR_IMAGE_RULES.find((rule) =>
    rule.keys.some((key) => haystack.includes(normalizeText(key)))
  );

  return match?.image || '/assets/images/Switzerland/Zurich1.avif';
};

const getTourThumbnail = (tour = {}) => {
  const migratedImage = getMigratedTourImages(tour)[0];
  if (migratedImage) return migratedImage;

  const direct = (
    firstImageValue(tour.thumbnail) ||
    firstImageValue(tour.cardImage) ||
    firstImageValue(tour.coverImage) ||
    firstImageValue(tour.images) ||
    firstImageValue(tour.gallery) ||
    firstImageValue(tour.media) ||
    firstImageValue(tour.metadata?.thumbnail) ||
    firstImageValue(tour.metadata?.cardImage) ||
    firstImageValue(tour.metadata?.coverImage)
  );

  if (direct) return direct;

  if (
    Number(tour.imageCount || 0) > 0 ||
    hasDataImageValue(tour.thumbnail) ||
    hasDataImageValue(tour.cardImage) ||
    hasDataImageValue(tour.coverImage) ||
    hasDataImageValue(tour.images) ||
    hasDataImageValue(tour.gallery) ||
    hasDataImageValue(tour.media)
  ) {
    const endpoint = getTourImageEndpoint(tour);
    if (endpoint) return endpoint;
  }

  return getStaticTourThumbnail(tour);
};

const summarizeImageField = (value) => {
  if (!value) return 'empty';
  if (Array.isArray(value)) {
    const dataUrlCount = value.filter((item) => isDataImage(typeof item === 'string' ? item : item?.url)).length;
    return `array(${value.length}, dataUrls:${dataUrlCount})`;
  }
  if (typeof value === 'object') return `object(${Object.keys(value).join(',')})`;
  if (isDataImage(value)) return 'dataUrl';
  if (isImageUrl(value)) return 'url';
  return typeof value;
};

const getTourImageDebugPayload = (tour = {}) => ({
  id: tour._id?.toString?.() || tour.id || '',
  name: tour.name || tour.title || '',
  images: summarizeImageField(tour.images),
  thumbnail: summarizeImageField(tour.thumbnail),
  coverImage: summarizeImageField(tour.coverImage),
  cardImage: summarizeImageField(tour.cardImage),
  gallery: summarizeImageField(tour.gallery),
  media: summarizeImageField(tour.media),
});

const stripDataImages = (images, tourId = '') => {
  if (!Array.isArray(images)) return [];
  const migratedImages = getMigratedTourImages(tourId);
  return images
    .map((image, index) => {
      const direct = readImageValue(image);
      if (direct) return direct;

      if (hasDataImageValue(image) && tourId) {
        if (migratedImages[index]) return migratedImages[index];
        const suffix = index > 0 ? `?index=${encodeURIComponent(String(index))}` : '';
        return `/api/tours/${encodeURIComponent(String(tourId))}/image${suffix}`;
      }

      return '';
    })
    .filter(Boolean);
};

module.exports = {
  IMAGE_FIELDS,
  getTourThumbnail,
  getStaticTourThumbnail,
  getTourImageDebugPayload,
  getTourImageEndpoint,
  getMigratedTourImages,
  stripDataImages,
};
