import React, { useState, useEffect } from "react";
import { getTourId } from "../utils/tourId";
import TourCard from "../components/TourCard";
import { fetchToursList } from "../services/toursApi";

const SwitzerlandLocations = () => {
  const [dbTours, setDbTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const tours = await fetchToursList({
          limit: 100,
        }, { skipCache: true });
        setDbTours(tours.filter((tour) => getTourId(tour)));
      } catch (error) {
        console.error('Error fetching Switzerland tours:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Switzerland Tours</h1>
          <p className="text-xl text-gray-600">
            Discover the beauty of Switzerland with our curated tour experiences
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
            <div className="text-xl text-gray-600">Loading tours...</div>
          </div>
        ) : dbTours.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">No tours available at the moment.</div>
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
