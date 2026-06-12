import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTourId } from "../utils/tourId";
import { fetchToursList } from "../services/toursApi";

const DestinationCards = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Fetch Switzerland tours from the database
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await fetchToursList({ division: 'switzerland', limit: 12 });
        if (data.length) {
          const swissTours = data.map(tour => {
              const tourId = getTourId(tour);
              return {
                id: tourId,
                name: tour.name,
                image: (Array.isArray(tour.images) && tour.images.find((img) => img && String(img).trim())) || null,
                listings: tour.maxTotalTickets || tour.travelers || 0,
                route: `/switzerland/${tourId}/checkout-sw`,
                price: tour.price
              };
            });
          setTours(swissTours);
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  // Check scroll position
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Touch/swipe handlers
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
    if (isRightSwipe && scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Discover Amazing <span className="text-orange-600">Switzerland</span>
          </h2>
          <p className="text-gray-600 text-lg">
            Explore our handpicked Switzerland tours and find your next alpine adventure
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-xl text-gray-600">Loading tours...</div>
          </div>
        ) : tours.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-xl text-gray-600">No tours available at the moment.</div>
          </div>
        ) : (
          <>
            {/* Scrollable Container */}
            <div className="relative">
              {/* Left Arrow */}
              {canScrollLeft && (
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-400"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700 hover:text-orange-600" />
                </button>
              )}

              {/* Right Arrow */}
              {canScrollRight && (
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-400"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700 hover:text-orange-600" />
                </button>
              )}

              {/* Scrollable Cards Container */}
              <div
                ref={scrollContainerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    onClick={() => navigate(tour.route)}
                    className="flex-shrink-0 w-[240px] sm:w-[280px] bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 group flex flex-col min-h-[390px]"
                  >
                    {/* Image Container */}
                    <div className="relative h-64 overflow-hidden">
                      {tour.image ? (
                        <img
                          src={tour.image}
                          alt={tour.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                          No image
                        </div>
                      )}
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                                
                      {/* Listing badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-gray-800 shadow-md">
                        {tour.listings} Tours
                      </div>
                    </div>
                
                    {/* Content */}
                    <div className="p-4 bg-white flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 mt-2 group-hover:text-orange-600 transition-colors" style={{paddingTop: '15px', paddingBottom: '15px'}}>
                        {tour.name}
                      </h3>
                      {tour.listings > 0 && (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {tour.listings} amazing experiences
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll Indicator Dots (optional) - Only show if there are more than 3 tours */}
            {tours.length > 3 && (
              <div className="flex justify-center gap-2 mt-6">
                {tours.slice(0, 3).map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full bg-gray-300"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default DestinationCards;
