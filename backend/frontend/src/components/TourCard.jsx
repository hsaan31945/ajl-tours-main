import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, Star } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useAdmin } from "../context/AdminContext";
import EditableField from "./EditableField";
import axios from "axios";
import { getTourId } from "../utils/tourId";
import { getBackendUrl } from "../utils/api";

const TourCard = ({ tour, onUpdate, onFavoriteToggle, isFavorite }) => {
  const { symbol, rate } = useCurrency();
  const { isAdmin, passcodeHeader } = useAdmin();
  const navigate = useNavigate();

  const tourId = getTourId(tour);
  
  const handleSaveField = async (field, value) => {
    if (!tourId) return false;
    try {
      const headers = passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {};
      const updateData = { ...tour, [field]: value };
      
      // If price, ensure it's a number
      if (field === "price") {
        updateData.price = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
      }

      const res = await axios.put(`${getBackendUrl()}/api/tours/${tourId}`, updateData, { headers });
      
      if (res.status === 200) {
        if (onUpdate) onUpdate(res.data.tour || res.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
      return false;
    }
  };

  const handleCardClick = () => {
    navigate(`/switzerland/${tourId}/checkout-sw`, { state: { tour } });
  };

  const displayImage =
    (Array.isArray(tour.images) && tour.images.find((img) => img && String(img).trim())) ||
    tour.photo ||
    null;

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden bg-gray-200">
        {displayImage ? (
        <img 
          src={displayImage} 
          alt={tour.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onFavoriteToggle) onFavoriteToggle(tour);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors z-10"
        >
          <Heart 
            className={`w-5 h-5 ${isFavorite ? "text-red-500 fill-current" : "text-gray-600"}`} 
          />
        </button>

        {/* Badge (Optional - e.g. Luxury) */}
        {tour.price > 20000 && (
          <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            Luxury
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Title */}
        <div onClick={(e) => e.stopPropagation()}>
          <EditableField
            tag="h3"
            value={tour.name || tour.title}
            className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] leading-tight"
            onSave={(val) => handleSaveField("name", val)}
            showEditIcon={isAdmin}
          />
        </div>

        {/* Location/Address */}
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="truncate">{tour.address || tour.startLocation || tour.destination || "Switzerland"}</span>
        </div>

        {/* Rating (If available) */}
        {(tour.rating || tour.avgRating) && (
          <div className="flex items-center mb-4">
            <div className="flex items-center text-yellow-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 font-bold text-gray-900">{tour.rating || tour.avgRating}</span>
            </div>
            {tour.reviews && (
              <span className="ml-2 text-gray-500 text-sm">({tour.reviews} reviews)</span>
            )}
          </div>
        )}

        {/* Bottom Row: Price and Button */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">From</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-black text-red-600">
                {symbol}
              </span>
              <EditableField
                tag="span"
                value={((tour.price || 0) * rate).toFixed(2)}
                className="text-2xl font-black text-red-600 ml-0.5"
                onSave={(val) => handleSaveField("price", val)}
                showEditIcon={isAdmin}
              />
              <span className="text-sm text-gray-500 ml-1">/person</span>
            </div>
          </div>
          
          <button 
            type="button"
            className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourCard;
