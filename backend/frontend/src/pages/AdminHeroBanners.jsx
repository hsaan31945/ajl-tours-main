import React, { useEffect, useState } from "react";
import { ExternalLink, Image, RotateCcw, Save, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { apiUrl } from "../utils/api";
import { adminImageFormatMessage, isAllowedAdminImageFile } from "../utils/imageValidation";
import {
  HERO_BANNERS_SECTION,
  HERO_BANNER_PAGES,
  normalizeHeroBanners,
} from "../utils/heroBanners";

const MAX_IMAGE_BYTES = 900 * 1024;
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

  const resetBanner = (page) => {
    updateBanner(page.key, "imageUrl", page.fallbackImage);
  };

  const handleFileUpload = async (page, file) => {
    if (!file) return;
    if (!isAllowedAdminImageFile(file)) {
      setError(`${adminImageFormatMessage} ${file.name} was not added.`);
      return;
    }

    try {
      const dataUrl = await compressImageToWebp(file);
      if (dataUrlBytes(dataUrl) > MAX_IMAGE_BYTES) {
        setError("This image is still too large after compression. Use a smaller WebP or AVIF image.");
        return;
      }
      updateBanner(page.key, "imageUrl", dataUrl);
    } catch (err) {
      setError(err.message || "Could not process this image");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(apiUrl(`/api/admin/content/${HERO_BANNERS_SECTION}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? { Authorization: `Bearer ${token}` }
            : (passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {})),
        },
        body: JSON.stringify({
          content: normalizeHeroBanners(banners),
          isActive: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Could not save hero banners");
      }

      const data = await response.json();
      setBanners(normalizeHeroBanners(data?.content || banners));
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
            <p className="mt-2 text-gray-600">Change the hero banner picture for each public page.</p>
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
            return (
              <section key={page.key} className="grid gap-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[280px_1fr]">
                <div className="overflow-hidden rounded-lg bg-gray-100">
                  {banner.imageUrl ? (
                    <img
                      src={banner.imageUrl}
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
                      <h2 className="text-xl font-bold text-gray-900">{page.label}</h2>
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

                  <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                    <label className="block">
                      <span className="mb-1 block text-sm font-semibold text-gray-700">Image URL</span>
                      <input
                        type="text"
                        value={banner.imageUrl || ""}
                        onChange={(event) => updateBanner(page.key, "imageUrl", event.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        placeholder="https://example.com/banner.webp"
                      />
                    </label>

                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 lg:mt-6">
                      <Upload className="h-4 w-4" />
                      Upload WebP/AVIF
                      <input
                        type="file"
                        accept=".webp,.avif,image/webp,image/avif"
                        className="hidden"
                        onChange={(event) => handleFileUpload(page, event.target.files?.[0])}
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
