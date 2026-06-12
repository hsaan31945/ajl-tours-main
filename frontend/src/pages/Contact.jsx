import React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import SEO from "../components/SEO";
import { createBreadcrumbJsonLd } from "../utils/seo";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Contact AJL Tours | Private Switzerland Tour Help"
        description="Contact AJL Tours for private Switzerland tours, custom itineraries, luxury transfers, booking support, and travel planning assistance."
        structuredData={createBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <section className="relative overflow-hidden bg-gray-900 text-white">
        <img
          src="/assets/images/optimized/hero6-1600.webp"
          alt="Swiss alpine road for private AJL Tours travel planning"
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Contact AJL Tours</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
            Speak with our team about private Switzerland tours, custom itineraries, and premium transfers.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <a
            href="mailto:hey@ajltour.com"
            className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
          >
            <Mail className="mb-4 h-8 w-8 text-orange-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-900">Email</h2>
            <p className="mt-2 text-gray-600">hey@ajltour.com</p>
          </a>

          <a
            href="tel:+41782078902"
            className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
          >
            <Phone className="mb-4 h-8 w-8 text-orange-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-900">Phone</h2>
            <p className="mt-2 text-gray-600">+41 78 207 89 02</p>
          </a>

          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <MapPin className="mb-4 h-8 w-8 text-orange-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-900">Office</h2>
            <p className="mt-2 text-gray-600">Plattenstrasse 7, 8152 Opfikon, Switzerland</p>
          </div>
        </div>

        <div className="mt-10 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Plan Your Private Tour</h2>
          <p className="mt-3 text-gray-700">
            Tell us your preferred travel date, group size, pickup location, and the Swiss destinations you want to visit. We will help shape the right private tour or transfer for your trip.
          </p>
          <div className="mt-6">
            <a
              href="mailto:hey@ajltour.com?subject=Private%20Switzerland%20Tour%20Inquiry"
              className="inline-flex rounded-lg bg-orange-600 px-6 py-3 font-bold text-white transition hover:bg-orange-700"
            >
              Email Our Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
