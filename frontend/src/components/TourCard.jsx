import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Plane, Star } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useAdmin } from "../context/AdminContext";
import { AppContext } from "../context/AppContext";
import EditableField from "./EditableField";
import { getTourId, getTourSeoPath } from "../utils/tourId";
import { apiUrl } from "../utils/api";
import { clearToursCache } from "../services/toursApi";
import { cleanDisplayName } from "../utils/textFormatting";
import { getDiscountPrice } from "../utils/bookingPricing";
import { getTourCardImage, getTourFallbackImage, getTourImageDebugPayload } from "../utils/tourImages";
import { useI18n } from "../i18n";

const TourCard = ({ tour, onUpdate, onFavoriteToggle, isFavorite }) => {
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  const { user } = useContext(AppContext);
  const { isAdmin, passcodeHeader } = useAdmin();
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const [localFavorite, setLocalFavorite] = useState(false);

  const tourId = getTourId(tour);
  const tourName = cleanDisplayName(tour?.name || tour?.title || "Tour");
  const effectiveFavorite = isFavorite ?? localFavorite;

  const getFavoriteKey = () => `favorites_${user?.email || 'guest'}`;

  const getFavoriteId = (item) => String(getTourId(item) || item?.id || item?._id || '');

  const getStoredFavorites = () => {
    try {
      const saved = localStorage.getItem(getFavoriteKey());
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  };

  const buildFavoriteTour = () => ({
    id: String(tourId),
    _id: String(tourId),
    title: tour.name || tour.title,
    name: tour.name || tour.title,
    photo: getTourCardImage(tour),
    price: tour.price,
    discountEnabled: Boolean(tour.discountEnabled),
    discountPrice: tour.discountPrice ?? null,
    description: tour.description,
    city: tour.destination || tour.city,
    avgRating: tour.rating || tour.avgRating,
    rating: tour.rating || tour.avgRating,
    reviews: tour.reviews,
    images: getTourCardImage(tour) ? [getTourCardImage(tour)] : [],
    address: tour.address || tour.startLocation,
    startLocation: tour.startLocation,
    endLocation: tour.endLocation,
    features: tour.features,
    destination: tour.destination,
    currency: tour.currency || 'CHF',
    metadata: tour.metadata || {},
  });

  const saveLocalFavorite = (nextFavorite) => {
    if (!tourId) return;
    const id = String(tourId);
    const favoritesList = getStoredFavorites().filter((item) => getFavoriteId(item) !== id);
    const nextList = nextFavorite ? [...favoritesList, buildFavoriteTour()] : favoritesList;
    localStorage.setItem(getFavoriteKey(), JSON.stringify(nextList));
    setLocalFavorite(nextFavorite);
    window.dispatchEvent(new Event('ajl:favorites-updated'));
  };

  const syncWishlist = async (nextFavorite) => {
    if (!user?.email || !tourId) return;

    try {
      const response = await fetch(apiUrl(nextFavorite ? '/api/customer/wishlist' : `/api/customer/wishlist/${tourId}`), {
        method: nextFavorite ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          tourId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || payload.message || 'Wishlist sync failed');
      }
    } catch (error) {
      console.error('Wishlist sync failed:', error);
    }
  };

  const handleFavoriteClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!tourId) return;

    const nextFavorite = !effectiveFavorite;

    if (onFavoriteToggle) {
      onFavoriteToggle(tour);
      setLocalFavorite(nextFavorite);
    } else {
      saveLocalFavorite(nextFavorite);
    }

    await syncWishlist(nextFavorite);
  };
  
  const handleSaveField = async (field, value) => {
    if (!tourId) return false;
    try {
      const updateData = { [field]: value };
      
      if (field === "price") {
        updateData.price = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
      }
      if (tour.metadata?.staticId) {
        updateData.metadata = { staticId: String(tour.metadata.staticId) };
      }

      const res = await fetch(apiUrl(`/api/tours/${tourId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          ...(passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {}),
        },
        cache: "no-store",
        body: JSON.stringify(updateData),
      });
      
      if (res.ok) {
        const data = await res.json();
        clearToursCache();
        if (onUpdate) onUpdate(data.tour || data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      return false;
    }
  };

  const primaryImage = getTourCardImage(tour);
  const fallbackImage = getTourFallbackImage(tour);
  const displayImage = imageFailed
    ? (fallbackFailed ? null : fallbackImage)
    : (primaryImage || fallbackImage);
  const ratingValue = Number(tour.rating || tour.avgRating || 0);
  const reviewsValue = Number(tour.reviews || 0);
  const originalPrice = Number(tour.price || 0);
  const discountPrice = getDiscountPrice(tour, originalPrice);
  const hasDiscount = discountPrice !== null;
  const detailPath = getTourSeoPath(tour);

  const handleCardClick = () => {
    if (!tourId) return;
    navigate(detailPath, { state: { tour } });
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick();
    }
  };

  const stopAdminFieldClick = (event) => {
    if (isAdmin) {
      event.stopPropagation();
    }
  };

  useEffect(() => {
    setImageFailed(false);
    setFallbackFailed(false);
  }, [primaryImage, fallbackImage]);

  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_TOUR_IMAGES === "true") {
      console.log("Tour card image debug:", getTourImageDebugPayload(tour));
    }
  }, [tour]);

  useEffect(() => {
    if (!tourId) {
      setLocalFavorite(false);
      return;
    }

    const refreshFavoriteState = () => {
      const id = String(tourId);
      setLocalFavorite(getStoredFavorites().some((item) => getFavoriteId(item) === id));
    };

    refreshFavoriteState();
    window.addEventListener('storage', refreshFavoriteState);
    window.addEventListener('ajl:favorites-updated', refreshFavoriteState);
    return () => {
      window.removeEventListener('storage', refreshFavoriteState);
      window.removeEventListener('ajl:favorites-updated', refreshFavoriteState);
    };
  }, [tourId, user?.email]);

  return (
    <article
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full group"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Link to={detailPath} state={{ tour }} aria-label={`${t("common.viewDetails")} ${tourName}`}>
        {displayImage && !imageFailed ? (
        <img 
          src={displayImage} 
          alt={`${tourName} private tour`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width="800"
          height="600"
          onError={() => {
            if (displayImage === fallbackImage) {
              setFallbackFailed(true);
            } else {
              setImageFailed(true);
            }
          }}
        />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-500 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-sm mb-3">
              <Plane className="w-7 h-7" />
            </div>
            <span className="text-sm font-semibold text-gray-800">AJL Tour</span>
            <span className="text-xs text-gray-500 mt-1">{t("common.imageComingSoon")}</span>
          </div>
        )}
        </Link>
        
        {/* Favorite Button */}
        <button 
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
          aria-pressed={effectiveFavorite}
          aria-label={effectiveFavorite ? t("common.removeFromWishlist") : t("common.addToWishlist")}
          title={effectiveFavorite ? t("common.removeFromWishlist") : t("common.addToWishlist")}
        >
          <Heart 
            className={`w-5 h-5 ${effectiveFavorite ? "text-red-500 fill-current" : "text-gray-600"}`} 
          />
        </button>

        {/* Badge (Optional - e.g. Luxury) */}
        {tour.price > 20000 && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            {t("common.luxury")}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <div onClick={stopAdminFieldClick}>
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight">
            <Link to={detailPath} state={{ tour }} className="hover:text-orange-700">
              {tourName}
            </Link>
          </h3>
          {isAdmin && (
            <EditableField
              tag="div"
              value={tourName}
            className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight"
            onSave={(val) => handleSaveField("name", val)}
            showEditIcon={isAdmin}
          />
          )}
        </div>

        {/* Location/Address */}
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{tour.address || tour.startLocation || tour.destination || "Switzerland"}</span>
        </div>

        {/* Rating (If available) */}
        {ratingValue > 0 && (
          <div className="flex items-center mb-4">
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 font-bold text-gray-900">{ratingValue}</span>
            </div>
            {reviewsValue > 0 && (
              <span className="ml-2 text-gray-500 text-sm">({reviewsValue} {t(reviewsValue === 1 ? "common.review" : "common.reviews")})</span>
            )}
          </div>
        )}

        {/* Bottom Row: Price and Button */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex flex-col" onClick={stopAdminFieldClick}>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t("common.from")}</span>
            {hasDiscount && (
              <span className="text-sm font-semibold text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <div className="flex items-baseline">
              {hasDiscount ? (
                <span className="text-2xl font-black text-red-600">
                  {formatPrice(discountPrice)}
                </span>
              ) : isAdmin ? (
                <>
                  <span className="text-2xl font-black text-red-600">CHF</span>
                  <EditableField
                    tag="span"
                    value={originalPrice.toFixed(2)}
                    className="text-2xl font-black text-red-600 ml-0.5"
                    onSave={(val) => handleSaveField("price", val)}
                    showEditIcon={isAdmin}
                  />
                </>
              ) : (
                <span className="text-2xl font-black text-red-600">{formatPrice(originalPrice)}</span>
              )}
              <span className="text-sm text-gray-500 ml-1">/{t("common.perPerson")}</span>
            </div>
          </div>
          
          <Link
            to={detailPath}
            state={{ tour }}
            className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {t("common.viewDetails")}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default TourCard;
