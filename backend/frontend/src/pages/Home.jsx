import React from "react";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import Services from "../components/Services";
import AllTours from "../components/AllTours";
import Experience from "../components/Experience";
import NewsLetterBox from "../components/NewsLetterBox";
import SpecialOfferSection from "../components/SpecialOfferSection";
import Testimonials from "../components/Testimonials";
import { useNavigate } from "react-router-dom";
import tourImg01 from "../assets/t1.jpg";
import tourImg02 from "../assets/t2.jpg";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Button from "../components/Button";
import ImageCarousel from "../components/ImageCarousel";
import tourImg03 from "../assets/t3.jpg";
import { useCurrency } from "../context/CurrencyContext";
import PopularDestinations from "../components/PopularDestinations";
import TopDealsSection from "../components/TopDealsSection";
import ExploreTours from "../components/ExploreTours";
import DestinationCards from "../components/DestinationCards";

const Home = () => {
  const navigate = useNavigate();
  const [showMalaysiaPopup, setShowMalaysiaPopup] = useState(false);
  const { symbol, rate, currency } = useCurrency();
  console.log("Home.jsx currency context:", { symbol, rate, currency });

  useEffect(() => {
    // Show popup 1s after homepage appears (loader is 1.5s)
    const timer = setTimeout(() => setShowMalaysiaPopup(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePopupClick = () => {
    setShowMalaysiaPopup(false);
    navigate("/switzerland");
  };

  const handleCloseClick = (e) => {
    e.stopPropagation(); // Prevent background click
    setShowMalaysiaPopup(false);
  };

  return (
    <div>
      {/* Malaysia Popup */}
      {showMalaysiaPopup && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-60" onClick={handlePopupClick}>
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src="/Malaysia.jpg"
              alt="Malaysia Promo"
              loading="lazy"
              decoding="async"
              className="rounded-lg shadow-2xl object-contain max-w-full max-h-[80vh] border-4 border-white"
              style={{ cursor: "pointer" }}
            />
            <button
              className="absolute top-2 right-2 bg-red-600 text-white rounded-none w-8 h-8 flex items-center justify-center text-2xl font-bold shadow hover:bg-black transition-colors"
              style={{ lineHeight: 1 }}
              onClick={handleCloseClick}
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      {/* Main Content */}
      <Header malaysiaPopupOpen={showMalaysiaPopup} />
      
      {/* Featured Tours Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="text-black">Featured Swiss </span>
              <span className="text-orange-600">Tours</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover Switzerland's hidden gems: Crash Landing on You locations, Alpine villages, Rhine Falls, and breathtaking landscapes!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-8">
            {/* Switzerland Card */}
            <motion.div
              className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center max-w-md w-full"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, y: -8 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <ImageCarousel images={[tourImg02, tourImg03, tourImg01]} alt="Switzerland" className="w-full h-64 object-cover rounded-lg mb-4" />
              <h2 className="text-3xl font-bold mb-2 text-black">Switzerland</h2>
              <div className="text-lg font-bold text-orange-600 mb-2">{symbol}{(15000 * rate).toFixed(2)} <span className="text-sm text-gray-500">/person</span></div>
              <p className="text-gray-600 mb-6 text-center">Discover Switzerland's hidden gems: Crash Landing on You locations, Alpine villages, Rhine Falls, and breathtaking landscapes!</p>
              <Button onClick={() => navigate("/switzerland")}>
                Explore
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Destination Cards Section */}
      <DestinationCards />
      
      {/* Explore Tours Section */}
      <ExploreTours />
      
      {/* Top Deals Section */}
      <TopDealsSection />
      
      {/* Services Section */}
      <Services />
      
      {/* Popular Destinations Section */}
      <PopularDestinations />
      
      {/* All Tours Section */}
      <AllTours />
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Experience Section */}
      <Experience />
      
      {/* Newsletter Section */}
      <NewsLetterBox />
      
      {/* Special Offer Section */}
      <SpecialOfferSection />
    </div>
  );
};

export default Home;
