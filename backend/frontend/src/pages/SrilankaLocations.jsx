import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, MessageCircle, Sparkles } from "lucide-react";
import SEO from "../components/SEO";
import TourCard from "../components/TourCard";
import TourCardSkeleton from "../components/TourCardSkeleton";
import { fetchToursList } from "../services/toursApi";
import { getTourId } from "../utils/tourId";
import { useHeroBanner } from "../hooks/useHeroBanner";

const highlights = [
  "Private day trips and custom itineraries",
  "Beach, culture, wildlife, and family-friendly plans",
  "Personal support for upcoming Srilanka tour requests",
];

const SrilankaLocations = () => {
  const [dbTours, setDbTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const heroBanner = useHeroBanner("srilanka", "/assets/images/hero6.jpg");

  const fetchTours = async () => {
    setLoading(true);
    setError("");
    try {
      const tours = await fetchToursList({ division: "srilanka", limit: 100 }, { skipCache: true });
      setDbTours(tours.filter((tour) => getTourId(tour) && tour?.isActive !== false));
    } catch (err) {
      console.error("Error fetching Srilanka tours:", err);
      setDbTours([]);
      setError("We couldn't load Srilanka tours right now.");
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
        title="Srilanka Tours | AJL Tours"
        description="Explore upcoming Srilanka tours with AJL Tours, including private travel plans, beaches, culture, wildlife, and custom trip support."
      />

      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src={heroBanner.imageUrl}
          alt={heroBanner.alt || "Srilanka hero banner"}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin className="h-4 w-4" />
              New destination
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Srilanka Tours
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Discover private Srilanka tour experiences with AJL Tours, from custom day trips to family-friendly travel plans.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contact us
              </Link>
              <Link
                to="/switzerland"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 shadow-lg transition hover:bg-gray-100"
              >
                View Switzerland tours
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map((highlight) => (
            <div key={highlight} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <Sparkles className="mb-4 h-6 w-6 text-orange-600" />
              <p className="text-base font-semibold leading-relaxed text-gray-900">{highlight}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Srilanka Tours</h2>
            <p className="mt-2 text-gray-600">Tours added to the Srilanka location will appear here.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <TourCardSkeleton count={6} />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-xl font-semibold text-gray-700">{error}</div>
              <button
                type="button"
                onClick={fetchTours}
                className="rounded-lg bg-orange-600 px-5 py-2.5 font-bold text-white hover:bg-orange-700"
              >
                Retry
              </button>
            </div>
          ) : dbTours.length === 0 ? (
            <div className="rounded-lg border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                    <CalendarDays className="h-4 w-4" />
                    Coming soon
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Srilanka tour packages are not listed yet</h3>
                  <p className="mt-2 max-w-2xl text-gray-600">
                    Add a tour to the Srilanka location from the admin dashboard and it will show here.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                >
                  Request a trip
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
      </section>
    </div>
  );
};

export default SrilankaLocations;
