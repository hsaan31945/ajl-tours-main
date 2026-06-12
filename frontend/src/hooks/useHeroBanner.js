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

const scheduleAfterFirstPaint = (callback, delayMs = 1500) => {
  if (typeof window === "undefined") return undefined;

  let idleId;
  let timeoutId;

  const runWhenIdle = () => {
    const run = () => callback();
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(run, { timeout: delayMs + 1500 });
    } else {
      timeoutId = window.setTimeout(run, delayMs);
    }
  };

  if (document.readyState === "complete") {
    timeoutId = window.setTimeout(runWhenIdle, delayMs);
  } else {
    const onLoad = () => {
      timeoutId = window.setTimeout(runWhenIdle, delayMs);
    };
    window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      if (idleId) window.cancelIdleCallback?.(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }

  return () => {
    if (idleId) window.cancelIdleCallback?.(idleId);
    if (timeoutId) window.clearTimeout(timeoutId);
  };
};

export const useHeroBanner = (pageKey, fallbackImage = "", fallbackImages = null, options = {}) => {
  const { deferMs = 1500, useCachedInitial = true } = options;
  const fallbackImagesKey = Array.isArray(fallbackImages) ? fallbackImages.join("|") : "";
  const initialImages = useMemo(() => {
    if (fallbackImagesKey) return fallbackImagesKey.split("|").filter(Boolean);
    return [fallbackImage || defaultBanners[pageKey]?.imageUrl || ""].filter(Boolean);
  }, [fallbackImage, fallbackImagesKey, pageKey]);

  const [banner, setBanner] = useState(() => {
    const cachedBanner = useCachedInitial ? readCachedHeroBanners()?.[pageKey] || {} : {};
    if (useCachedInitial && (cachedBanner.imageUrl || (Array.isArray(cachedBanner.images) && cachedBanner.images.length))) {
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

    const cancelScheduledLoad = scheduleAfterFirstPaint(loadBanner, deferMs);

    return () => {
      cancelled = true;
      cancelScheduledLoad?.();
    };
  }, [deferMs, fallbackImage, initialImages, pageKey]);

  return banner;
};
