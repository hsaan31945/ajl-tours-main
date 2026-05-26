import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminImageFormatMessage, isAllowedAdminImageFile } from "../utils/imageValidation";

/**
 * Responsive image display:
 *  · DESKTOP (md+): Viator/GYG-style photo grid — hero left + 2×2 thumbnails right + "View all" lightbox
 *  · MOBILE (<md):  Full-width slider with dots, image count badge, touch/swipe, auto-advance
 */
const ImageCarousel = ({ images, alt, className = "", adminOn = false, onSaveImages = null }) => {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const dragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Image Editing State
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [editableImages, setEditableImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditingImages) {
      setEditableImages(Array.isArray(images) ? [...images] : []);
      setNewImageUrl("");
    }
  }, [isEditingImages, images]);

  // Handle file upload. Admin uploads are restricted to WebP/AVIF.
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const invalidFiles = files.filter((file) => !isAllowedAdminImageFile(file));
    if (invalidFiles.length > 0) {
      alert(`${adminImageFormatMessage}\n\nRejected: ${invalidFiles.map((file) => file.name).join(', ')}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const readImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.readAsDataURL(file);
      });
    };

    const promises = files.map(file => readImage(file));

    Promise.all(promises).then(base64Images => {
      setEditableImages(prev => [...prev, ...base64Images]);
      // Reset input value to allow uploading the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const items = useMemo(() => (
    Array.isArray(images) ? images.filter(Boolean) : images ? [images] : []
  ), [images]);
  const total = items.length;

  const scrollToIndex = useCallback((i) => {
    if (!total) return;
    const nextIndex = (i + total) % total;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
  }, [total]);

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    if (total > 1) timerRef.current = setInterval(() => scrollToIndex(indexRef.current + 1), 5000);
  }, [scrollToIndex, total]);

  useEffect(() => {
    items.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [items]);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Auto-advance for mobile slider
  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(() => scrollToIndex(indexRef.current + 1), 5000);
    return () => clearInterval(timerRef.current);
  }, [scrollToIndex, total]);

  const goTo = (i) => { scrollToIndex(i); resetTimer(); };
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const pauseMobileAutoAdvance = () => {
    clearInterval(timerRef.current);
  };

  const handleMobileTouchStart = (e) => {
    if (total <= 1) return;
    pauseMobileAutoAdvance();
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  const handleMobileTouchMove = (e) => {
    if (touchStartXRef.current == null || touchStartYRef.current == null) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    // Let vertical page scrolling win when the gesture is mostly vertical.
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
      dragOffsetRef.current = 0;
      setDragOffset(0);
      return;
    }

    const width = e.currentTarget.clientWidth || 1;
    const offset = Math.max(-28, Math.min(28, (deltaX / width) * 100));
    dragOffsetRef.current = offset;
    setDragOffset(offset);
  };

  const handleMobileTouchEnd = (e) => {
    if (touchStartXRef.current == null) {
      resetTimer();
      return;
    }

    const width = e.currentTarget.clientWidth || 1;
    const threshold = Math.min(70, Math.max(36, width * 0.16));
    const deltaX = (dragOffsetRef.current / 100) * width;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    dragOffsetRef.current = 0;
    setDragOffset(0);

    if (Math.abs(deltaX) >= threshold) {
      // Exactly one image per swipe. No native scroll-snap skipping.
      if (deltaX < 0) {
        scrollToIndex(indexRef.current + 1);
      } else {
        scrollToIndex(indexRef.current - 1);
      }
    }

    resetTimer();
  };

  const openLightbox = (i) => { setLightboxIndex(i); setLightboxOpen(true); };
  const closeLightbox = () => setLightboxOpen(false);
  const lbPrev = () => setLightboxIndex((i) => (i - 1 + total) % total);
  const lbNext = () => setLightboxIndex((i) => (i + 1) % total);
  const onKey = (e) => { if (e.key === "Escape") closeLightbox(); if (e.key === "ArrowLeft") lbPrev(); if (e.key === "ArrowRight") lbNext(); };

  const onErr = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
  };

  if (total === 0) return null;

  const hero = items[0];
  const thumbs = [items[1] || null, items[2] || null, items[3] || null, items[4] || null];

  return (
    <>
      {/* ═══════════════════════════════════════════════════
          DESKTOP: Viator-style photo grid  (hidden on mobile)
          ═══════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative" style={{ gap: "6px", height: "420px", width: "100%", borderRadius: "16px", overflow: "hidden" }}>
        
        {adminOn && (
          <button
            onClick={() => setIsEditingImages(true)}
            className="absolute top-4 right-4 z-10 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 flex items-center gap-2 border border-gray-200"
            title="Edit Images"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span className="text-sm font-semibold pr-1">Edit Photos</span>
          </button>
        )}

        {/* Hero */}
        <div onClick={() => openLightbox(0)} style={{ flex: "0 0 60%", overflow: "hidden", cursor: "pointer" }}>
          <img src={hero} alt={`${alt} 1`}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onError={onErr} loading="lazy" draggable={false}
          />
        </div>

        {/* 2×2 thumbnails */}
        <div style={{ flex: "0 0 calc(40% - 6px)", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "6px" }}>
          {thumbs.map((img, slot) => {
            const isLast = slot === 3;
            return (
              <div key={slot} onClick={() => openLightbox(img ? slot + 1 : 0)}
                style={{ position: "relative", overflow: "hidden", background: "#e5e7eb", cursor: "pointer" }}>
                {img ? (
                  <>
                    <img src={img} alt={`${alt} ${slot + 2}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onError={onErr} loading="lazy" draggable={false}
                    />
                    {isLast && (
                      <div onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "10px" }}>
                        <span style={{ background: "white", color: "#111", borderRadius: "8px", padding: "6px 12px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          View all
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#f3f4f6" }}>
                    {isLast && total > 1 && (
                      <div onClick={(e) => { e.stopPropagation(); openLightbox(0); }}
                        style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: "10px" }}>
                        <span style={{ background: "white", color: "#111", borderRadius: "8px", padding: "6px 12px", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          View all
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOBILE: Full-width slider  (hidden on desktop)
          ═══════════════════════════════════════════════════ */}
      <div
        className={`block md:hidden ${className}`}
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#f3f4f6",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        {adminOn && (
          <button
            onClick={() => setIsEditingImages(true)}
            className="absolute top-4 right-4 z-10 bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 border border-gray-200"
            title="Edit Images"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        )}
        {/* Active mobile image. Keep a single painted image to avoid off-screen slide blanks on iOS/Chrome. */}
        <div
          className="ajl-mobile-carousel-track"
          onTouchStart={handleMobileTouchStart}
          onTouchMove={handleMobileTouchMove}
          onTouchCancel={handleMobileTouchEnd}
          onTouchEnd={handleMobileTouchEnd}
          style={{
            display: "block",
            height: "100%",
            width: "100%",
            overflow: "hidden",
            overscrollBehaviorX: "contain",
            touchAction: "pan-y",
          }}
        >
          <img
            key={`${index}-${items[index]}`}
            src={items[index]}
            alt={`${alt} ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              pointerEvents: "none",
              transform: `translate3d(${dragOffset}%, 0, 0)`,
              transition: dragOffset === 0 ? "transform 220ms ease, opacity 180ms ease" : "none",
              willChange: "transform",
            }}
            draggable={false}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            onError={onErr}
          />
        </div>
        <style>{`.ajl-mobile-carousel-track::-webkit-scrollbar{display:none}`}</style>

        {/* Prev arrow */}
        {total > 1 && (
          <button onClick={prev} aria-label="Previous"
            style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.82)", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
            <svg width="16" height="16" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
        )}

        {/* Next arrow */}
        {total > 1 && (
          <button onClick={next} aria-label="Next"
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.82)", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
            <svg width="16" height="16" fill="none" stroke="#222" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        )}

        {/* Dots */}
        {total > 1 && (
          <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px", alignItems: "center" }}>
            {items.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={`Image ${i + 1}`}
                style={{ width: i === index ? "20px" : "8px", height: "8px", borderRadius: "99px", border: "none", padding: 0, cursor: "pointer", background: i === index ? "white" : "rgba(255,255,255,0.55)", transition: "width 0.3s, background 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
              />
            ))}
          </div>
        )}

        {/* Image count badge */}
        {total > 1 && (
          <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", color: "white", borderRadius: "20px", padding: "4px 10px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            {total}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          LIGHTBOX (shared by both layouts)
          ═══════════════════════════════════════════════════ */}
      {lightboxOpen && (
        <div tabIndex={-1} onKeyDown={onKey} onClick={closeLightbox} ref={(el) => el && el.focus()}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* Top bar */}
          <div onClick={(e) => e.stopPropagation()}
            style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", color: "white" }}>
            <span style={{ fontSize: "14px", opacity: 0.75 }}>{lightboxIndex + 1} / {total}</span>
            <button onClick={closeLightbox} aria-label="Close"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", color: "white", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          {/* Main image */}
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "78vh" }}>
            <img src={items[lightboxIndex]} alt={`${alt} ${lightboxIndex + 1}`}
              style={{ maxWidth: "90vw", maxHeight: "78vh", objectFit: "contain", borderRadius: "8px", display: "block" }} onError={onErr} />
          </div>
          {/* Prev/Next */}
          {total > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); lbPrev(); }} aria-label="Previous"
                style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "50px", height: "50px", cursor: "pointer", color: "white", fontSize: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); lbNext(); }} aria-label="Next"
                style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: "50px", height: "50px", cursor: "pointer", color: "white", fontSize: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </>
          )}
          {/* Thumbnail strip */}
          {total > 1 && (
            <div onClick={(e) => e.stopPropagation()}
              style={{ position: "absolute", bottom: "14px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", maxWidth: "90vw", overflowX: "auto", padding: "4px" }}>
              {items.map((img, i) => (
                <button key={i} onClick={() => setLightboxIndex(i)} aria-label={`Image ${i + 1}`}
                  style={{ width: "58px", height: "42px", padding: 0, border: i === lightboxIndex ? "2px solid white" : "2px solid transparent", borderRadius: "4px", overflow: "hidden", cursor: "pointer", flexShrink: 0, opacity: i === lightboxIndex ? 1 : 0.55, transition: "opacity 0.2s, border-color 0.2s" }}>
                  <img src={img} alt={`thumb ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={onErr} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          IMAGE EDITING MODAL (Admin Only)
          ═══════════════════════════════════════════════════ */}
      {isEditingImages && (
        <div className="fixed inset-0 z-[10000] bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Manage Tour Photos</h2>
              <button onClick={() => setIsEditingImages(false)} className="text-gray-500 hover:text-gray-800">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">Current Photos ({editableImages.length})</h3>
                {editableImages.length === 0 ? (
                  <p className="text-gray-500 italic">No photos available.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {editableImages.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-video">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" onError={onErr} />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => setEditableImages(editableImages.filter((_, i) => i !== idx))}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transform hover:scale-110 transition"
                            title="Delete Photo"
                          >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Add New Photo</h3>
                
                {/* File Upload Section */}
                <div className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white">
                  <input
                    type="file"
                    accept="image/webp,image/avif,.webp,.avif"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="carousel-image-upload"
                    ref={fileInputRef}
                  />
                  <label
                    htmlFor="carousel-image-upload"
                    className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-orange-600 transition"
                  >
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="font-semibold">Click to upload from your device</span>
                    <span className="text-xs mt-1">WebP or AVIF only</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <hr className="flex-1 border-gray-300" />
                  <span className="text-xs text-gray-400 font-semibold uppercase">OR ADD BY URL</span>
                  <hr className="flex-1 border-gray-300" />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter image URL (e.g. https://example.com/photo.jpg)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newImageUrl.trim()) {
                        e.preventDefault();
                        setEditableImages([...editableImages, newImageUrl.trim()]);
                        setNewImageUrl("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        setEditableImages([...editableImages, newImageUrl.trim()]);
                        setNewImageUrl("");
                      }
                    }}
                    disabled={!newImageUrl.trim()}
                    className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition text-sm whitespace-nowrap"
                  >
                    Add URL
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsEditingImages(false)}
                className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onSaveImages) {
                    await onSaveImages(editableImages);
                  }
                  setIsEditingImages(false);
                }}
                className="px-5 py-2 bg-orange-600 text-white font-semibold rounded hover:bg-orange-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCarousel;
