import React, { useEffect, useState } from "react";
import { ExternalLink, Image, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { apiUrl } from "../utils/api";
import { adminImageFormatMessage, isAllowedAdminImageFile } from "../utils/imageValidation";
import {
  cacheHeroBanners,
  HERO_BANNERS_SECTION,
  HERO_BANNER_PAGES,
  normalizeHeroBanners,
} from "../utils/heroBanners";

const MAX_IMAGE_BYTES = 300 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

const dataUrlBytes = (dataUrl) => {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
};

const compressImageToWebp = (file) => new Promise((resolve, reject) => {
  const image = new window.Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const tryQuality = (quality) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(`Could not process ${file.name}`));
          return;
        }

        if (blob.size <= MAX_IMAGE_BYTES || quality <= 0.55) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
          reader.readAsDataURL(blob);
          return;
        }

        tryQuality(quality - 0.12);
      }, "image/webp", quality);
    };

    tryQuality(0.82);
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error(`Could not load ${file.name}`));
  };

  image.src = objectUrl;
});

const AdminHeroBanners = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, token, passcodeHeader } = useAdmin();
  const [banners, setBanners] = useState(() => normalizeHeroBanners());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newImageUrls, setNewImageUrls] = useState({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin");
    }
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    let cancelled = false;
    const fetchBanners = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(apiUrl(`/api/admin/content/${HERO_BANNERS_SECTION}`), {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : (passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {}),
        });

        if (response.status === 404) {
          if (!cancelled) setBanners(normalizeHeroBanners());
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Could not load hero banners");
        }

        const data = await response.json();
        if (!cancelled) setBanners(normalizeHeroBanners(data?.content || {}));
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load hero banners");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanners();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, passcodeHeader, token]);

  const updateBanner = (pageKey, field, value) => {
    setMessage("");
    setError("");
    setBanners((current) => ({
      ...current,
      [pageKey]: {
        ...current[pageKey],
        [field]: value,
      },
    }));
  };

  const getPageFallbackImages = (page) => (
    Array.isArray(page.fallbackImages) && page.fallbackImages.length
      ? page.fallbackImages
      : [page.fallbackImage].filter(Boolean)
  );

  const resetBanner = (page) => {
    const images = getPageFallbackImages(page);
    setMessage("");
    setError("");
    setBanners((current) => ({
      ...current,
      [page.key]: {
        ...current[page.key],
        images,
        imageUrl: images[0] || "",
      },
    }));
  };

  const addImageToBanner = (pageKey, imageUrl) => {
    const trimmedUrl = String(imageUrl || "").trim();
    if (!trimmedUrl) return;

    setMessage("");
    setError("");
    setBanners((current) => {
      const currentImages = Array.isArray(current[pageKey]?.images)
        ? current[pageKey].images
        : [current[pageKey]?.imageUrl].filter(Boolean);
      const images = [...currentImages, trimmedUrl];
      return {
        ...current,
        [pageKey]: {
          ...current[pageKey],
          images,
          imageUrl: images[0] || "",
        },
      };
    });
  };

  const handleAddImageUrl = (pageKey) => {
    addImageToBanner(pageKey, newImageUrls[pageKey]);
    setNewImageUrls((current) => ({ ...current, [pageKey]: "" }));
  };

  const removeImage = (pageKey, imageIndex) => {
    setMessage("");
    setError("");
    setBanners((current) => {
      const currentImages = Array.isArray(current[pageKey]?.images)
        ? current[pageKey].images
        : [current[pageKey]?.imageUrl].filter(Boolean);
      const images = currentImages.filter((_, index) => index !== imageIndex);
      return {
        ...current,
        [pageKey]: {
          ...current[pageKey],
          images,
          imageUrl: images[0] || "",
        },
      };
    });
  };

  const handleFileUpload = async (page, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const invalidFiles = files.filter((file) => !isAllowedAdminImageFile(file));
    if (invalidFiles.length) {
      setError(`${adminImageFormatMessage} Rejected: ${invalidFiles.map((file) => file.name).join(", ")}`);
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => compressImageToWebp(file)));
      const tooLarge = dataUrls.some((dataUrl) => dataUrlBytes(dataUrl) > MAX_IMAGE_BYTES);
      if (tooLarge) {
        setError("At least one image is still too large after compression. Use smaller WebP or AVIF images.");
        return;
      }
      dataUrls.forEach((dataUrl) => addImageToBanner(page.key, dataUrl));
    } catch (err) {
      setError(err.message || "Could not process these images");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const normalizedBanners = normalizeHeroBanners(banners);
      const response = await fetch(apiUrl(`/api/admin/content/${HERO_BANNERS_SECTION}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : (passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {})),
        },
        body: JSON.stringify({
          content: normalizedBanners,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Could not save hero banners");
      }

      const data = await response.json();
      const savedBanners = normalizeHeroBanners(data?.content || normalizedBanners);
      cacheHeroBanners(savedBanners);
      setBanners(savedBanners);
      setMessage("Hero banners saved.");
    } catch (err) {
      setError(err.message || "Could not save hero banners");
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hero Banners</h1>
            <p className="mt-2 text-gray-600">Add and delete hero images for public page banners.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Banners"}
          </button>
        </div>

        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 font-semibold text-green-700">{message}</div>}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</div>}

        <div className="space-y-5">
          {HERO_BANNER_PAGES.map((page) => {
            const banner = banners[page.key] || {};
            const images = Array.isArray(banner.images)
              ? banner.images.filter(Boolean)
              : [banner.imageUrl].filter(Boolean);
            const firstImage = images[0] || "";
            return (
              <section key={page.key} className="grid gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[280px_1fr]">
                <div className="overflow-hidden rounded-lg bg-gray-100">
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={banner.alt || page.label}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-gray-500">
                      <Image className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {page.label}
                        {page.key === "home" && <span className="ml-2 text-sm font-semibold text-orange-600">Carousel</span>}
                      </h2>
                      <Link
                        to={page.path}
                        className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-orange-700 hover:text-orange-800"
                      >
                        View page
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => resetBanner(page)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>

                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {images.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-500">
                        No images added.
                      </div>
                    ) : images.map((imageUrl, imageIndex) => (
                      <div key={`${imageUrl}-${imageIndex}`} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <div className="relative h-28">
                          <img
                            src={imageUrl}
                            alt={`${banner.alt || page.label} ${imageIndex + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            {imageIndex + 1}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(page.key, imageIndex)}
                          className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_160px_220px]">
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-gray-700">Add image URL</span>
                      <input
                        type="text"
                        value={newImageUrls[page.key] || ""}
                        onChange={(event) => setNewImageUrls((current) => ({
                          ...current,
                          [page.key]: event.target.value,
                        }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddImageUrl(page.key);
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="https://example.com/banner.webp"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddImageUrl(page.key)}
                      disabled={!String(newImageUrls[page.key] || "").trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 lg:mt-6"
                    >
                      <Plus className="h-4 w-4" />
                      Add URL
                    </button>

                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 lg:mt-6">
                      <Upload className="h-4 w-4" />
                      Upload Images
                      <input
                        type="file"
                        accept=".webp,.avif,image/webp,image/avif"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          handleFileUpload(page, event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-1 block text-sm font-semibold text-gray-700">Alt text</span>
                    <input
                      type="text"
                      value={banner.alt || ""}
                      onChange={(event) => updateBanner(page.key, "alt", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder={`${page.label} hero banner`}
                    />
                  </label>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminHeroBanners;
