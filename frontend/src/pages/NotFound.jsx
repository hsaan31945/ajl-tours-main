import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const NotFound = () => (
  <main className="flex min-h-[65vh] items-center justify-center bg-gray-50 px-6 py-16">
    <SEO
      title="Page Not Found | AJL Tours"
      description="The page you requested could not be found. Browse AJL Tours destinations and private Switzerland tours."
      noIndex
    />
    <div className="max-w-xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">404</p>
      <h1 className="mt-3 text-4xl font-extrabold text-gray-900">This route took a scenic detour.</h1>
      <p className="mt-4 text-lg text-gray-600">
        The page may have moved, but your next private tour is still easy to find.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/tours" className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700">
          Browse tours
        </Link>
        <Link to="/" className="rounded-full border border-gray-300 bg-white px-6 py-3 font-bold text-gray-800 hover:bg-gray-100">
          Return home
        </Link>
      </div>
    </div>
  </main>
);

export default NotFound;
