import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, MessageCircle, Sparkles } from "lucide-react";
import SEO from "../components/SEO";
import TourCard from "../components/TourCard";
import TourCardSkeleton from "../components/TourCardSkeleton";
import { fetchToursList } from "../services/toursApi";
import { getTourId } from "../utils/tourId";
import { useHeroBanner } from "../hooks/useHeroBanner";
import { createBreadcrumbJsonLd } from "../utils/seo";

const highlights = [
  "Private day trips and custom itineraries",
  "Cities, countryside, culture, and family-friendly plans",
  "Personal support for custom France tour requests",
];

const FranceLocations = () => {
  const [dbTours, setDbTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const heroBanner = useHeroBanner("france", "/assets/images/optimized/hero7-1600.webp");

  const fetchTours = async () => {
    setLoading(true);
    setError("");
    try {
      const tours = await fetchToursList({ division: "france", limit: 100 }, { skipCache: true });
      setDbTours(tours.filter((tour) => getTourId(tour) && tour?.isActive !== false));
    } catch (err) {
      console.error("Error fetching France tours:", err);
      setDbTours([]);
      setError("We couldn't load France tours right now.");
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
        title="France Private Tours | AJL Tours"
        description="Plan a custom France private tour with AJL Tours, including iconic cities, countryside, culture, family travel, and personal itinerary support."
        canonicalPath="/france"
        image={heroBanner.imageUrl}
        structuredData={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "France", path: "/france" },
        ])}
      />

      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src={heroBanner.imageUrl}
          alt={heroBanner.alt || "France private tour landscape"}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <MapPin className="h-4 w-4" />
              New destination
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">France Tours</h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Discover private France experiences with AJL Tours, from iconic cities and countryside escapes to custom family travel plans.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-700"
              >
                <MessageCircle className="h-4 w-4" />
                Contact us
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
            <h2 className="text-3xl font-bold text-gray-900">France Tours</h2>
            <p className="mt-2 text-gray-600">Private itineraries designed around your dates, interests, and travel style.</p>
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
                    Custom private itineraries
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Planning a France journey?</h3>
                  <p className="mt-2 max-w-2xl text-gray-600">
                    Tell us your dates and interests. Our team will create a private itinerary for your group.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
                >
                  Request an itinerary
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
                      prev.map((previousTour) => (
                        getTourId(previousTour) === getTourId(updated) ? updated : previousTour
                      ))
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

export default FranceLocations;
