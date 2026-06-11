import React, { useState, useEffect } from "react";
import { getTourId } from "../utils/tourId";
import TourCard from "../components/TourCard";
import { fetchToursList } from "../services/toursApi";
import SEO from "../components/SEO";
import TourCardSkeleton from "../components/TourCardSkeleton";
import { useHeroBanner } from "../hooks/useHeroBanner";

const SwitzerlandLocations = () => {
  const [dbTours, setDbTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const heroBanner = useHeroBanner("switzerland", "/assets/images/optimized/hero5-1600.webp");

  const fetchTours = async () => {
    setLoading(true);
    setError("");
    try {
      const tours = await fetchToursList({
        division: 'switzerland',
        limit: 100,
      });
      setDbTours(tours.filter((tour) => getTourId(tour) && tour?.isActive !== false));
    } catch (err) {
      console.error('Error fetching Switzerland tours:', err);
      setDbTours([]);
      setError("We couldn't load Switzerland tours right now.");
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
        title="Private Switzerland Tours | AJL Tours"
        description="Discover private Switzerland tours with AJL Tours, from scenic day trips to custom premium travel experiences."
      />
      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src={heroBanner.imageUrl}
          alt={heroBanner.alt || "Switzerland hero banner"}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Switzerland Tours</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Discover the beauty of Switzerland with our curated private tour experiences.
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
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-xl text-gray-700 font-semibold mb-4">{error}</div>
            <button
              type="button"
              onClick={fetchTours}
              className="px-5 py-2.5 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-700"
            >
              Retry
            </button>
          </div>
        ) : dbTours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-xl text-gray-700 font-semibold">No tours available at the moment.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dbTours.map((tour) => (
              <TourCard
                key={getTourId(tour)}
                tour={tour}
                onUpdate={(updated) => {
                  setDbTours((prev) =>
                    prev.map((pt) => (getTourId(pt) === getTourId(updated) ? updated : pt))
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SwitzerlandLocations;
