import React, { useState, useEffect, useContext } from "react";
import { Heart, MapPin, Star, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppContext } from "../context/AppContext";
import { useCurrency } from "../context/CurrencyContext";
import TourCard from "../components/TourCard";

const Favorites = () => {
  const { user } = useContext(AppContext);
  const { symbol, rate } = useCurrency();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const savedFavorites = localStorage.getItem(`favorites_${user?.email || 'guest'}`);
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Remove tour from favorites
  const removeFromFavorites = (tourId) => {
    const updatedFavorites = favorites.filter(tour => tour.id !== tourId);
    setFavorites(updatedFavorites);
    
    // Update localStorage
    const userKey = user?.email || 'guest';
    localStorage.setItem(`favorites_${userKey}`, JSON.stringify(updatedFavorites));
  };

  // Add tour to favorites (for consistency)
  const addToFavorites = (tour) => {
    const userKey = user?.email || 'guest';
    const updatedFavorites = [...favorites, tour];
    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${userKey}`, JSON.stringify(updatedFavorites));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-1">
                {favorites.length} {favorites.length === 1 ? 'tour' : 'tours'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring tours and add them to your favorites by clicking the heart icon.
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            >
              Explore Tours
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                isFavorite={true}
                onFavoriteToggle={() => removeFromFavorites(tour.id)}
                // Admin editing likely not needed in Favorites view but supported if passed
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;



