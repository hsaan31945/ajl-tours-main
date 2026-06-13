import React, { useCallback, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppContext } from "../context/AppContext";
import TourCard from "./TourCard";
import { getTourId } from "../utils/tourId";
import { fetchToursList } from "../services/toursApi";
import TourCardSkeleton from "./TourCardSkeleton";

const CARD_AUTOPLAY_MS = 4500;
const CARD_TRANSITION_MS = 700;
const CARD_GAP_REM = 1.5;

const ExploreTours = () => {
  const navigate = useNavigate();
  const { user } = useContext(AppContext);
  const [randomTours, setRandomTours] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState({});
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [visibleCards, setVisibleCards] = useState(3);
  const [isSliding, setIsSliding] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // Load tours from MongoDB only. No localStorage or hardcoded fallbacks.
  const loadTours = useCallback(async () => {
    const data = await fetchToursList({ division: 'switzerland', limit: 12, sort: 'newest' });
    if (!data.length) return [];

    return data
      .filter(t => t?.isActive !== false)
      .map(t => ({
        ...t,
        id: t.id ?? t._id ?? t.id_str ?? t.name,
        _id: t._id ?? t.id ?? t.id_str,
        slug: t.slug,
        name: t.name,
        title: t.title || t.name,
        price: Number(t.price ?? 0),
        discountEnabled: Boolean(t.discountEnabled),
        discountPrice: t.discountPrice ?? null,
        thumbnail: t.thumbnail || t.photo || '',
        cardImage: t.cardImage,
        coverImage: t.coverImage,
        gallery: t.gallery,
        media: t.media,
        images: Array.isArray(t.images) && t.images.length
          ? t.images
          : (t.thumbnail || t.photo ? [t.thumbnail || t.photo] : []),
        description: t.description,
        destination: t.divisionName || 'switzerland',
        address: t.startLocation || t.location || '',
        isActive: t.isActive !== false,
      }))
      .filter(t => t && t.name && Number.isFinite(t.price));
  }, []);

  const fetchAndSetTours = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const tours = await loadTours();
      setRandomTours(tours);
    } catch (err) {
      console.error('Error loading tours:', err);
      setRandomTours([]);
      setError("We couldn't load your tours right now.");
    } finally {
      setLoading(false);
    }
  }, [loadTours]);

  // Load favorites on component mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const userKey = user?.email || 'guest';
        const savedFavorites = localStorage.getItem(`favorites_${userKey}`);
        if (savedFavorites) {
          const favoritesList = JSON.parse(savedFavorites);
          const favoritesMap = {};
          favoritesList.forEach(tour => {
            // Store with standardized ID format for matching
            const tourId = getTourId(tour)?.toString();
            if (tourId) {
              favoritesMap[tourId] = true;
              if (tour.id && tourId !== String(tour.id)) {
            favoritesMap[tour.id] = true;
              }
            }
          });
          setFavorites(favoritesMap);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, [user]);

  useEffect(() => {
    fetchAndSetTours();
  }, [fetchAndSetTours]);

  const handleTourClick = (tour) => {
    if (!tour || !tour.id) {
      console.error('Tour or tour.id is missing:', tour);
      return;
    }
    
    try {
      // Use the unified Top Deals / Country Tours interface for all tours globally
      navigate(`/switzerland/${tour.id}/checkout-sw`, { state: { tour } });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = (e, tour) => {
    if (e) {
    e.preventDefault();
    e.stopPropagation();
    }
    
    try {
      if (!tour) {
        console.error('Tour is missing in toggleFavorite:', tour);
        return;
      }

      // Get tour ID using standardized utility
      const tourId = getTourId(tour)?.toString();
      if (!tourId) {
        console.error('Tour ID is missing:', tour);
        return;
      }

      const userKey = user?.email || 'guest';
      const savedFavorites = localStorage.getItem(`favorites_${userKey}`);
      let favoritesList = savedFavorites ? JSON.parse(savedFavorites) : [];
      
      // Check if already favorite using multiple ID formats
      const isFavorite = favorites[tourId] || 
                        favorites[tour.id] ||
                        favoritesList.some(fav => {
                          const favId = fav.id?.toString() || String(fav.id);
                          return favId === tourId || favId === String(tour.id);
                        });
      
      if (isFavorite) {
        // Remove from favorites
        favoritesList = favoritesList.filter(fav => {
          const favId = fav.id?.toString() || String(fav.id);
          return favId !== tourId && favId !== String(tour.id);
        });
        setFavorites(prev => {
          const newFavs = { ...prev };
          delete newFavs[tourId];
          delete newFavs[tour.id];
          return newFavs;
        });
      } else {
        // Add complete tour data to favorites
        const completeTourData = {
          id: tourId,
          title: tour.name || tour.title,
          photo: tour.images?.[0] || tour.photo,
          price: tour.price,
          discountEnabled: Boolean(tour.discountEnabled),
          discountPrice: tour.discountPrice ?? null,
          description: tour.description,
          city: tour.destination || tour.city,
          avgRating: tour.rating || tour.avgRating,
          reviews: tour.reviews,
          images: tour.images || [],
          address: tour.address || tour.startLocation,
          features: tour.features,
          destination: tour.destination
        };
        favoritesList.push(completeTourData);
        setFavorites(prev => ({ ...prev, [tourId]: true, [tour.id]: true }));
      }
      
      localStorage.setItem(`favorites_${userKey}`, JSON.stringify(favoritesList));
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  // Update visible cards based on screen size
  useEffect(() => {
    const updateVisibleCards = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        setVisibleCards(1); // Mobile: 1 card
      } else if (width < 1024) {
        setVisibleCards(2); // Tablet: 2 cards
      } else {
        setVisibleCards(3); // Desktop: 3 cards
      }
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  const canLoop = randomTours.length > visibleCards;
  const carouselTours = canLoop
    ? [
        ...randomTours.slice(-visibleCards),
        ...randomTours,
        ...randomTours.slice(0, visibleCards),
      ]
    : randomTours;
  const translatePercent = (currentIndex * 100) / visibleCards;
  const translateGap = (currentIndex * CARD_GAP_REM) / visibleCards;

  useEffect(() => {
    setIsSliding(false);
    setCurrentIndex(canLoop ? visibleCards : 0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsSliding(true));
    });
  }, [canLoop, randomTours.length, visibleCards]);

  useEffect(() => {
    if (!canLoop) return undefined;
    if (currentIndex >= randomTours.length + visibleCards) {
      const timeout = window.setTimeout(() => {
        setIsSliding(false);
        setCurrentIndex(visibleCards);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setIsSliding(true));
        });
      }, CARD_TRANSITION_MS);
      return () => window.clearTimeout(timeout);
    }

    if (currentIndex < visibleCards) {
      const timeout = window.setTimeout(() => {
        setIsSliding(false);
        setCurrentIndex(randomTours.length + visibleCards - 1);
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setIsSliding(true));
        });
      }, CARD_TRANSITION_MS);
      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [canLoop, currentIndex, randomTours.length, visibleCards]);

  // Auto-slide at a middle pace while keeping the track continuous.
  useEffect(() => {
    if (!canLoop || isMobile) return undefined;
    const id = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, CARD_AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [canLoop, isMobile]);

  // Navigation functions - responsive based on screen size
  const goToPrevious = () => {
    if (!canLoop) return;
    setCurrentIndex(prev => prev - 1);
  };

  const goToNext = () => {
    if (!canLoop) return;
    setCurrentIndex(prev => prev + 1);
  };

  // Touch handlers for mobile swipe support
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const nextTours = () => {
    goToNext();
  };

  const prevTours = () => {
    goToPrevious();
  };

  return (
    <section className="w-full py-16 sm:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            Explore Tours
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Discover amazing experiences with our curated selection of premium tours
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TourCardSkeleton count={isMobile ? 1 : 3} />
          </div>
        ) : error ? (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-700 font-semibold mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchAndSetTours}
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        ) : randomTours.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-700 font-semibold">No tours available at the moment.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Arrows */}
            {canLoop && (
              <button
                onClick={prevTours}
                className="absolute left-0 top-1/2 z-10 flex -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2 shadow-lg sm:-translate-x-6 sm:p-2.5"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}

            {canLoop && (
              <button
                onClick={nextTours}
                className="absolute right-0 top-1/2 z-10 flex translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white p-2 shadow-lg sm:translate-x-6 sm:p-2.5"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            )}

            <div className="overflow-hidden">
              <div 
                className={`flex items-stretch ease-in-out ${isSliding ? "transition-transform duration-700" : ""}`}
                style={{ 
                  gap: `${CARD_GAP_REM}rem`,
                  transform: `translateX(calc(-${translatePercent}% - ${translateGap}rem))`
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {carouselTours.map((tour, index) => (
                  <div 
                    key={`${tour.id}-${index}`}
                    className="flex-shrink-0 flex flex-col"
                    style={{
                      width: `calc((100% - ${(visibleCards - 1) * CARD_GAP_REM}rem) / ${visibleCards})`
                    }}
                  >
                    <TourCard
                      tour={tour}
                      isFavorite={favorites[tour.id?.toString()] || favorites[tour.id]}
                      onFavoriteToggle={(t) => toggleFavorite(null, t)}
                      onUpdate={(updated) => {
                        setRandomTours(prev => prev.map(pt => pt.id === updated.id ? updated : pt));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        
      </div>
    </section>
  );
};

export default ExploreTours;
