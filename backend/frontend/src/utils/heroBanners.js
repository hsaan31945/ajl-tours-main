import { apiUrl } from "./api";

export const HERO_BANNERS_SECTION = "hero_banners";

export const HERO_BANNER_PAGES = [
  {
    key: "home",
    label: "Home",
    path: "/",
    fallbackImage: "/assets/images/hero4.jpg",
  },
  {
    key: "switzerland",
    label: "Switzerland",
    path: "/switzerland",
    fallbackImage: "/assets/images/hero5.jpg",
  },
  {
    key: "srilanka",
    label: "Srilanka",
    path: "/srilanka",
    fallbackImage: "/assets/images/hero6.jpg",
  },
  {
    key: "tours",
    label: "Tours",
    path: "/tours",
    fallbackImage: "/assets/images/hero7.jpg",
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
    fallbackImage: "/assets/images/hero6.jpg",
  },
];

export const getDefaultHeroBanners = () =>
  HERO_BANNER_PAGES.reduce((acc, page) => {
    acc[page.key] = {
      imageUrl: page.fallbackImage,
      alt: `${page.label} hero banner`,
    };
    return acc;
  }, {});

export const normalizeHeroBanners = (content = {}) => {
  const defaults = getDefaultHeroBanners();
  return HERO_BANNER_PAGES.reduce((acc, page) => {
    const saved = content?.[page.key] || {};
    acc[page.key] = {
      ...defaults[page.key],
      ...saved,
      imageUrl: String(saved.imageUrl || defaults[page.key].imageUrl || "").trim(),
      alt: String(saved.alt || defaults[page.key].alt || "").trim(),
    };
    return acc;
  }, {});
};

export const fetchPublicHeroBanners = async () => {
  const response = await fetch(apiUrl(`/api/content/homepage/${HERO_BANNERS_SECTION}`));
  if (response.status === 404) return {};
  if (!response.ok) throw new Error("Could not load hero banners");
  const data = await response.json();
  return data?.content || {};
};
