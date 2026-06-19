import { apiUrl } from "./api";

export const HERO_BANNERS_SECTION = "hero_banners";
export const HERO_BANNERS_CACHE_KEY = "ajlHeroBanners";
export const HERO_BANNERS_UPDATED_EVENT = "ajl:hero-banners-updated";
export const MAX_HERO_IMAGES = 4;

export const HERO_BANNER_PAGES = [
  {
    key: "home",
    label: "Home",
    path: "/",
    fallbackImage: "/assets/images/optimized/hero4-1600.webp",
    fallbackImages: [
      "/assets/images/optimized/hero4-1600.webp",
      "/assets/images/optimized/hero5-1600.webp",
      "/assets/images/optimized/hero6-1600.webp",
      "/assets/images/optimized/hero7-1600.webp",
    ],
  },
  {
    key: "switzerland",
    label: "Switzerland",
    path: "/switzerland",
    fallbackImage: "/assets/images/optimized/hero5-1600.webp",
  },
  {
    key: "srilanka",
    label: "Sri Lanka",
    path: "/sri-lanka",
    fallbackImage: "/assets/images/optimized/hero6-1600.webp",
  },
  {
    key: "tours",
    label: "Tours",
    path: "/tours",
    fallbackImage: "/assets/images/optimized/hero7-1600.webp",
  },
  {
    key: "about",
    label: "About",
    path: "/about",
    fallbackImage: "https://img.freepik.com/free-photo/travel-concept-with-landmarks_23-2149153256.jpg?w=1800",
  },
  {
    key: "blogs",
    label: "Blogs",
    path: "/blogs",
    fallbackImage: "/assets/images/optimized/hero6-1600.webp",
  },
];

export const getDefaultHeroBanners = () =>
  HERO_BANNER_PAGES.reduce((acc, page) => {
    const images = Array.isArray(page.fallbackImages) && page.fallbackImages.length
      ? page.fallbackImages
      : [page.fallbackImage];

    acc[page.key] = {
      imageUrl: page.fallbackImage,
      images,
      alt: `${page.label} hero banner`,
    };
    return acc;
  }, {});

const normalizeImages = (saved, defaults) => {
  if (Array.isArray(saved?.images)) {
    return saved.images
      .map((image) => (typeof image === "string" ? image : image?.url || image?.imageUrl || ""))
      .map((image) => String(image || "").trim())
      .filter(Boolean);
  }

  const candidates = Array.isArray(saved?.images)
    ? saved.images
    : (Array.isArray(saved?.imageUrls) ? saved.imageUrls : []);
  const images = candidates
    .map((image) => (typeof image === "string" ? image : image?.url || image?.imageUrl || ""))
    .map((image) => String(image || "").trim())
    .filter(Boolean);

  if (images.length) return images;
  if (saved?.imageUrl) return [String(saved.imageUrl).trim()].filter(Boolean);
  return Array.isArray(defaults.images) ? defaults.images : [defaults.imageUrl].filter(Boolean);
};

export const normalizeHeroBanners = (content = {}) => {
  const defaults = getDefaultHeroBanners();
  return HERO_BANNER_PAGES.reduce((acc, page) => {
    const saved = content?.[page.key] || {};
    const images = normalizeImages(saved, defaults[page.key]);
    acc[page.key] = {
      ...defaults[page.key],
      ...saved,
      images,
      imageUrl: images[0] || "",
      alt: String(saved.alt || defaults[page.key].alt || "").trim(),
    };
    return acc;
  }, {});
};

export const readCachedHeroBanners = () => {
  if (typeof window === "undefined") return {};

  try {
    const cached = window.localStorage.getItem(HERO_BANNERS_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    return {};
  }
};

export const cacheHeroBanners = (content = {}) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HERO_BANNERS_CACHE_KEY, JSON.stringify(content || {}));
  } catch (error) {
    // Ignore cache write failures; the API remains the source of truth.
  }

  window.dispatchEvent(new CustomEvent(HERO_BANNERS_UPDATED_EVENT, {
    detail: content || {},
  }));
};

export const fetchPublicHeroBanners = async () => {
  const response = await fetch(
    apiUrl(`/api/content/homepage/${HERO_BANNERS_SECTION}`),
    { cache: "default" },
  );
  if (response.status === 404) return {};
  if (!response.ok) throw new Error("Could not load hero banners");
  const data = await response.json();
  const content = data?.content || {};
  cacheHeroBanners(content);
  return content;
};
