import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, MessageCircle, Sparkles } from "lucide-react";
import SEO from "../components/SEO";

const highlights = [
  "Private day trips and custom itineraries",
  "Beach, culture, wildlife, and family-friendly plans",
  "Personal support for upcoming Sri Lanka tour requests",
];

const SirilankaLocations = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Sirilanka Tours | AJL Tours"
        description="Explore upcoming Sirilanka tours with AJL Tours, including private travel plans, beaches, culture, wildlife, and custom trip support."
      />

      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src="/assets/images/hero6.jpg"
          alt="Scenic destination landscape"
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
              Sirilanka Tours
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/90">
              Sri Lanka private tour experiences are being prepared. Contact AJL Tours to plan a custom trip or get notified when packages are available.
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

        <div className="mt-10 rounded-lg border border-orange-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">
                <CalendarDays className="h-4 w-4" />
                Coming soon
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sirilanka tour packages are not listed yet</h2>
              <p className="mt-2 max-w-2xl text-gray-600">
                The page is ready. Once tours are added, this destination can be expanded with live tour cards and booking options.
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
      </section>
    </div>
  );
};

export default SirilankaLocations;
