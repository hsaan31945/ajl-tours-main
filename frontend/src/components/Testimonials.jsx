import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "PR",
      location: "Germany",
      rating: 5,
      date: "June 7, 2025",
      review: "I had a truly wonderful experience with AJL Tours during my visit to Zürich. From the beginning to the end, everything was handled with professionalism and care. What made the tour especially memorable was my driver, Mr. Shabbir. He went above and beyond to ensure I had a fantastic time. He took his time to show me around, shared interesting insights about the city, and made sure every moment felt personal and well thought out. It wasn't just a ride; it was a treat that turned into a highlight of my trip.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "AJ",
      location: "Japan",
      rating: 5,
      date: "June 24, 2025",
      review: "The chauffeur who worked with us was professional, very polite and punctual. He has good skill of communication also. His explanation and advise about the traffic was also helpful. Highly recommend AJL Tours for anyone visiting Switzerland.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "CW",
      location: "United Kingdom",
      rating: 5,
      date: "May 29, 2025",
      review: "Great service! The ride was early and the customer service was excellent. I would surely recommend their services! The Swiss tour was absolutely amazing and our guide was fantastic.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Nish",
      location: "Switzerland",
      rating: 5,
      date: "Dec 19, 2024",
      review: "Very seamless transfer, drivers were super friendly. The Crash Landing on You tour was incredible - they knew all the perfect spots and made our experience unforgettable.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "AT",
      location: "Lithuania",
      rating: 5,
      date: "Oct 17, 2024",
      review: "They are very professional and being on time always. I always prefer to work with them because of their competitive price and also because of their flexibility in any changes. Highly recommend them to work with for Swiss tours.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "JC",
      location: "United States",
      rating: 5,
      date: "Oct 17, 2024",
      review: "On time, professional service, respectful and safe driver. Would recommend you to my family and friends. The Alpine tour was breathtaking and our guide Zafar was excellent.",
      source: "Trustpilot",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face"
    }
  ];

  // Auto-rotate testimonials every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Happy <span className="text-orange-500">Clients</span> Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our guests have to say about their AJL Tours experience.
          </p>
        </div>

        {/* Single Testimonial Card with Auto-transition */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Rating Stars */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex">
                  {renderStars(currentTestimonial.rating)}
                </div>
                <span className="text-sm text-gray-500 ml-2">{currentTestimonial.source}</span>
              </div>
              
              {/* Testimonial Text */}
              <blockquote className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
                "{currentTestimonial.review}"
              </blockquote>
              
              {/* Client Info */}
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 text-lg">{currentTestimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{currentTestimonial.location}</p>
                  </div>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="mt-8 flex items-center justify-center space-x-2">
                <div className="flex">
                  {renderStars(5)}
                </div>
                <span className="text-lg font-semibold text-gray-700">4.5</span>
                <span className="text-sm text-gray-500">(8 reviews)</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? 'bg-orange-500' : 'bg-gray-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Read more reviews on{" "}
            <a 
              href="https://www.trustpilot.com/review/ajltransfer.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Trustpilot
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span>✓ Verified Reviews</span>
            <span>✓ Real Experiences</span>
            <span>✓ Trusted Platform</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
