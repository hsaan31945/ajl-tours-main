import React, { useState, useEffect } from "react";
import TourCard from "../components/TourCard";
import { getTourId } from "../utils/tourId";
import { fetchToursList } from "../services/toursApi";

const Tour = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await fetchToursList({ division: 'switzerland', limit: 100 }, { skipCache: true });
        setTours(data);
      } catch (error) {
        console.error('Error fetching tours:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Tours</h1>
          <p className="text-xl text-gray-600">Explore our full collection of premium tour experiences</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading amazing tours...</p>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">No tours available at the moment.</p>
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

