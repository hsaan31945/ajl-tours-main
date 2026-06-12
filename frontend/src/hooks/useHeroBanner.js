import { useEffect, useMemo, useState } from "react";
import { fetchPublicHeroBanners, getDefaultHeroBanners, readCachedHeroBanners } from "../utils/heroBanners";

const defaultBanners = getDefaultHeroBanners();

const buildBannerState = (pageKey, savedBanner = {}, fallbackImage = "", fallbackImages = [], isLoading = false) => {
  const savedImages = Array.isArray(savedBanner.images)
    ? savedBanner.images.map((image) => String(image || "").trim()).filter(Boolean)
    : [];
  const hasSavedImage = Boolean(savedBanner.imageUrl || savedImages.length);
  const images = savedImages.length
    ? savedImages
    : [savedBanner.imageUrl || fallbackImage || fallbackImages[0]].filter(Boolean);

  return {
    imageUrl: images[0] || "",
    images,
    alt: savedBanner.alt || defaultBanners[pageKey]?.alt || "",
    isCustom: hasSavedImage,
    isLoading,
  };
};

export const useHeroBanner = (pageKey, fallbackImage = "", fallbackImages = null) => {
  const fallbackImagesKey = Array.isArray(fallbackImages) ? fallbackImages.join("|") : "";
  const initialImages = useMemo(() => {
    if (fallbackImagesKey) return fallbackImagesKey.split("|").filter(Boolean);
    return [fallbackImage || defaultBanners[pageKey]?.imageUrl || ""].filter(Boolean);
  }, [fallbackImage, fallbackImagesKey, pageKey]);

  const [banner, setBanner] = useState(() => {
    const cachedBanner = readCachedHeroBanners()?.[pageKey] || {};
    if (cachedBanner.imageUrl || (Array.isArray(cachedBanner.images) && cachedBanner.images.length)) {
      return buildBannerState(pageKey, cachedBanner, fallbackImage, initialImages, true);
    }

    return {
      imageUrl: initialImages[0] || "",
      images: initialImages,
      alt: defaultBanners[pageKey]?.alt || "",
      isCustom: false,
      isLoading: true,
    };
  });

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const banners = await fetchPublicHeroBanners();
        if (!cancelled) {
          const savedBanner = banners[pageKey] || {};
          setBanner(buildBannerState(pageKey, savedBanner, fallbackImage, initialImages, false));
        }
      } catch (error) {
        if (!cancelled) {
          setBanner((current) => ({ ...current, isLoading: false }));
        }
      }
    };

    loadBanner();

    return () => {
      cancelled = true;
    };
  }, [fallbackImage, initialImages, pageKey]);

  return banner;
};
