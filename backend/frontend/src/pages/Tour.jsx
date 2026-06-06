import React, { useState, useEffect } from "react";
import TourCard from "../components/TourCard";
import SEO from "../components/SEO";
import { getTourId } from "../utils/tourId";
import { fetchToursList } from "../services/toursApi";
import TourCardSkeleton from "../components/TourCardSkeleton";
import { useHeroBanner } from "../hooks/useHeroBanner";

const Tour = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const heroBanner = useHeroBanner("tours", "/assets/images/hero7.jpg");

  const fetchTours = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchToursList({ division: 'switzerland', limit: 100 });
      setTours(data.filter((tour) => tour?.isActive !== false));
    } catch (err) {
      console.error('Error fetching tours:', err);
      setTours([]);
      setError("We couldn't load tours right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Switzerland Tours | AJL Tours"
        description="Explore AJL Tours' full collection of private Switzerland day tours, luxury transfers, and premium guided experiences."
      />
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src={heroBanner.imageUrl}
          alt={heroBanner.alt || "Tours hero banner"}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Our Tours</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Explore our full collection of premium private tour experiences.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TourCardSkeleton count={6} />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-xl text-gray-700 font-semibold mb-4">{error}</p>
            <button
              type="button"
              onClick={fetchTours}
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-xl text-gray-700 font-semibold">No tours available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard
                key={getTourId(tour)}
                tour={tour}
                onUpdate={(updated) => {
                  setTours(prev => prev.map(pt => getTourId(pt) === getTourId(updated) ? updated : pt));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tour;
