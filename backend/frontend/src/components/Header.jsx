import React, { useState } from "react";
import { motion } from "framer-motion";
import heroImage from "../assets/images/optimized/hero6-900.webp";

// Hero header inspired by GetYourGuide
const Header = ({ malaysiaPopupOpen }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Hook this into real search later
    console.log("Search:", query);
  };

  return (
    <section
      className="relative w-full overflow-hidden rounded-none md:rounded-3xl shadow-lg bg-gray-900"
      style={{ minHeight: "70vh" }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.25)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: malaysiaPopupOpen ? "scale(0.98)" : "scale(1)",
          transition: "transform 300ms ease, filter 300ms ease",
          filter: "saturate(1.05)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="text-sm sm:text-base font-semibold uppercase tracking-wide text-white/80 mb-3">
            Discover & book things to do
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Discover & book things to do
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/85 max-w-2xl">
            Find unforgettable tours, day trips, and experiences tailored to the way you travel.
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="mt-8 sm:mt-10"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/95 backdrop-blur rounded-full shadow-2xl p-2 sm:p-2.5 gap-2 max-w-3xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find places and things to do"
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 px-4 py-3 text-base sm:text-lg focus:outline-none rounded-full"
            />
            <button
              type="submit"
              className="shrink-0 px-6 sm:px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base sm:text-lg transition-colors"
            >
              Search
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default Header;
