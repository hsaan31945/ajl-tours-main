import { useEffect, useState } from "react";
import { fetchPublicHeroBanners, getDefaultHeroBanners } from "../utils/heroBanners";

const defaultBanners = getDefaultHeroBanners();

export const useHeroBanner = (pageKey, fallbackImage = "") => {
  const [banner, setBanner] = useState(() => ({
    imageUrl: fallbackImage || defaultBanners[pageKey]?.imageUrl || "",
    alt: defaultBanners[pageKey]?.alt || "",
    isCustom: false,
  }));

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const banners = await fetchPublicHeroBanners();
        if (!cancelled) {
          const savedBanner = banners[pageKey] || {};
          const hasSavedImage = Boolean(savedBanner.imageUrl);
          setBanner({
            imageUrl: savedBanner.imageUrl || fallbackImage,
            alt: savedBanner.alt || defaultBanners[pageKey]?.alt || "",
            isCustom: hasSavedImage,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setBanner({
            imageUrl: fallbackImage || defaultBanners[pageKey]?.imageUrl || "",
            alt: defaultBanners[pageKey]?.alt || "",
            isCustom: false,
          });
        }
      }
    };

    loadBanner();

    return () => {
      cancelled = true;
    };
  }, [fallbackImage, pageKey]);

  return banner;
};
