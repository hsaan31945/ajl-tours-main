const TOUR_IMAGE_RULES = [
  {
    keys: ['rhine falls', 'stein am rhein'],
    image: '/assets/images/Zurich_to_Rhine_Falls/Rhine1.avif',
  },
  {
    keys: ['titlis', 'engelberg'],
    image: '/assets/images/Titlis_Engelberg/Titlis1.avif',
  },
  {
    keys: ['interlaken', 'grindelwald'],
    image: '/assets/images/Interlaken_and_Grindelwald/Interlaken1.avif',
  },
  {
    keys: ['basel', 'colmar'],
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
    keys: ['liechtenstein', 'vaduz', 'heidiland', 'landquart', 'lindt', 'walensee', 'austria', 'germany'],
    image: '/assets/images/Switzerland/Zurich1.avif',
  },
  {
    keys: ['zurich', 'zürich', 'switzerland'],
    image: '/assets/images/Switzerland/Zurich1.avif',
  },
];

const isHttpUrl = (value = '') => /^https?:\/\//i.test(String(value || ''));
const isDataImage = (value = '') => /^data:image\//i.test(String(value || '').trim());

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const readImageValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return isDataImage(value) ? '' : value.trim();
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

export const getTourFallbackImage = (tour = {}) => {
  const haystack = normalize([
    tour.name,
    tour.title,
    tour.description,
    tour.destination,
    tour.location,
    tour.startLocation,
    tour.divisionName,
    tour.metadata?.staticId,
  ].filter(Boolean).join(' '));

  const match = TOUR_IMAGE_RULES.find((rule) =>
    rule.keys.some((key) => haystack.includes(normalize(key)))
  );

  return match?.image || '/assets/images/Switzerland/Zurich1.avif';
};

export const resolveTourImageUrl = (image = '') => {
  const value = readImageValue(image);
  if (!value) return '';
  if (isHttpUrl(value)) return value;
  if (value.startsWith('/assets/') || value.startsWith('/src/assets/') || value.startsWith('./')) return value;
  if (value.startsWith('/')) {
    const configured = (import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '').trim();
    const backendBase = configured && isHttpUrl(configured) ? configured.replace(/\/$/, '') : '';
    return backendBase ? `${backendBase}${value}` : value;
  }
  return value;
};

export function getTourCardImage(tour = {}) {
  const image = (
    firstImageValue(tour.thumbnail) ||
    firstImageValue(tour.cardImage) ||
    firstImageValue(tour.coverImage) ||
    firstImageValue(tour.images) ||
    firstImageValue(tour.gallery) ||
    firstImageValue(tour.media)
  );

  return resolveTourImageUrl(image || getTourFallbackImage(tour));
}

export const getTourImageDebugPayload = (tour = {}) => ({
  name: tour.name || tour.title || '',
  thumbnail: Array.isArray(tour.thumbnail) ? `array(${tour.thumbnail.length})` : typeof tour.thumbnail,
  images: Array.isArray(tour.images) ? `array(${tour.images.length})` : typeof tour.images,
  coverImage: Array.isArray(tour.coverImage) ? `array(${tour.coverImage.length})` : typeof tour.coverImage,
  cardImage: Array.isArray(tour.cardImage) ? `array(${tour.cardImage.length})` : typeof tour.cardImage,
  gallery: Array.isArray(tour.gallery) ? `array(${tour.gallery.length})` : typeof tour.gallery,
});
