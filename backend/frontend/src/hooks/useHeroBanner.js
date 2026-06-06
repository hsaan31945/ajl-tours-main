import { useEffect, useMemo, useState } from "react";
import { fetchPublicHeroBanners, getDefaultHeroBanners } from "../utils/heroBanners";

const defaultBanners = getDefaultHeroBanners();

export const useHeroBanner = (pageKey, fallbackImage = "", fallbackImages = null) => {
  const fallbackImagesKey = Array.isArray(fallbackImages) ? fallbackImages.join("|") : "";
  const initialImages = useMemo(() => {
    if (fallbackImagesKey) return fallbackImagesKey.split("|").filter(Boolean);
    return [fallbackImage || defaultBanners[pageKey]?.imageUrl || ""].filter(Boolean);
  }, [fallbackImage, fallbackImagesKey, pageKey]);

  const [banner, setBanner] = useState(() => ({
    imageUrl: initialImages[0] || "",
    images: initialImages,
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
          const savedImages = Array.isArray(savedBanner.images)
            ? savedBanner.images.map((image) => String(image || "").trim()).filter(Boolean)
            : [];
          const hasSavedImage = Boolean(savedBanner.imageUrl || savedImages.length);
          const images = savedImages.length
            ? savedImages
            : [savedBanner.imageUrl || fallbackImage].filter(Boolean);
          setBanner({
            imageUrl: images[0] || fallbackImage,
            images,
            alt: savedBanner.alt || defaultBanners[pageKey]?.alt || "",
            isCustom: hasSavedImage,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setBanner({
            imageUrl: initialImages[0] || "",
            images: initialImages,
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
  }, [fallbackImage, initialImages, pageKey]);

  return banner;
};
