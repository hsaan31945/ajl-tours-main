import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchToursList } from "../services/toursApi";
import { useCurrency } from "../context/CurrencyContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTourId } from "../utils/tourId";
import TourCard from "./TourCard";
import TourCardSkeleton from "./TourCardSkeleton";

const TopDealsSection = () => {
  const navigate = useNavigate();
  const { symbol, rate } = useCurrency();
  const [topSwissTours, setTopSwissTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toursPerView, setToursPerView] = useState(3);

  // Calculate tours per view based on screen size
  useEffect(() => {
    const updateToursPerView = () => {
      if (window.innerWidth < 768) {
        setToursPerView(1); // Mobile: 1 tour
      } else if (window.innerWidth < 1024) {
        setToursPerView(2); // Tablet: 2 tours
      } else {
        setToursPerView(3); // Desktop: 3 tours
      }
    };

    updateToursPerView();
    window.addEventListener('resize', updateToursPerView);
    return () => window.removeEventListener('resize', updateToursPerView);
  }, []);

  // Reset index when tours change
  useEffect(() => {
    setCurrentIndex(0);
  }, [topSwissTours.length]);

  const loadTopSellingTours = async () => {
    setLoading(true);
    setError("");
    try {
      const allTours = await fetchToursList({
        division: 'switzerland',
        limit: 12,
        sort: 'popular',
      });

      const toursWithSales = allTours
        .filter(tour => tour?.isActive !== false)
        .map(tour => {
          const tourId = getTourId(tour)?.toString();
          
          return {
            id: tourId || tour.id,
            staticId: tour.metadata?.staticId ? String(tour.metadata.staticId) : '',
            name: tour.name,
            desc: tour.description,
            description: tour.description,
            price: Number(tour.price) || 0,
            images: Array.isArray(tour.images) && tour.images.length > 0 ? tour.images : [],
            rating: tour.rating,
            reviews: tour.reviews,
            address: tour.startLocation || tour.address,
            destination: tour.divisionName || tour.destination || 'switzerland',
            salesCount: 0 // Default to 0, use reviews/rating for sorting
          };
        });

      // Sort by reviews count, then by rating
      const sortedTours = toursWithSales.sort((a, b) => {
        // Sort by reviews count
        if ((b.reviews || 0) !== (a.reviews || 0)) {
          return (b.reviews || 0) - (a.reviews || 0);
        }
        // If reviews are equal, sort by rating
        return (b.rating || 0) - (a.rating || 0);
      });

      // MongoDB is the source of truth. Show tours even if an image has not been uploaded yet.
      const topTours = sortedTours
        .filter(t => t && t.name)
        .slice(0, 5);

      setTopSwissTours(topTours);
    } catch (err) {
      console.error('Error loading top selling tours:', err);
      setTopSwissTours([]);
      setError("We couldn't load top deals right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopSellingTours();
  }, []);

  // Navigation functions
  const nextTours = () => {
    const maxIndex = Math.max(0, topSwissTours.length - toursPerView);
    if (currentIndex < maxIndex) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevTours = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const canGoNext = currentIndex < topSwissTours.length - toursPerView;
  const canGoPrev = currentIndex > 0;

  return (
    <section className="w-full py-12 sm:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Top Deals
          </h2>
          <button
            type="button"
            className="text-sm sm:text-base font-semibold text-orange-600 hover:text-orange-700"
            onClick={() => navigate("/switzerland")}
          >
            View All Deals
          </button>
        </div>

        {/* Destination pills (only Switzerland for now) */}
        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            className="px-5 py-2 rounded-full bg-orange-600 text-white text-sm sm:text-base font-semibold shadow-sm"
          >
            Switzerland
          </button>
        </div>

        {/* Cards Carousel */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TourCardSkeleton count={toursPerView} />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-700 font-semibold mb-4">{error}</p>
            <button
              type="button"
              onClick={loadTopSellingTours}
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        ) : topSwissTours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-700 font-semibold">No top deals available at the moment.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Left Arrow */}
            {canGoPrev && (
              <button
                onClick={prevTours}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                aria-label="Previous tours"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            )}

            {/* Right Arrow */}
            {canGoNext && (
              <button
                onClick={nextTours}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors border border-gray-200"
                aria-label="Next tours"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            )}

            {/* Carousel Container */}
            <div className="overflow-hidden relative">
              <div
                className="flex items-stretch transition-transform duration-500 ease-in-out"
                style={{
                  gap: '1.5rem',
                  transform: `translateX(calc(-${currentIndex} * (100% / ${toursPerView} + ${1.5 / toursPerView}rem)))`
                }}
              >
                {topSwissTours.map((tour) => (
                  <div
                    key={tour.id}
                    className="flex-shrink-0 flex flex-col"
                    style={{
                      width: `calc((100% - ${(toursPerView - 1) * 1.5}rem) / ${toursPerView})`
                    }}
                  >
                    <TourCard
                      tour={tour}
                      onUpdate={(updated) => {
                        setTopSwissTours(prev => prev.map(pt => pt.id === updated.id ? updated : pt));
                      }}
                      // Favorites handled globally or locally if needed
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

export default TopDealsSection;
