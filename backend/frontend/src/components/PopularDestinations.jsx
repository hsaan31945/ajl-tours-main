import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { EffectCoverflow, Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";

const destinations = [
  {
    name: "Switzerland",
    listings: 8,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    route: "/switzerland",
  },
];

const PopularDestinations = () => {
  const navigate = useNavigate();

  const handleViewAll = (route) => {
    navigate(route);
  };

  return (
    <section className="w-full max-w-6xl mx-auto py-12 sm:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <div className="text-sm sm:text-base text-orange-600 font-semibold mb-2">Top Destination</div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-black">Popular Destination</h2>
      </div>
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        autoHeight={false}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 200,
          modifier: 2.0,
          slideShadows: false,
        }}
        modules={[EffectCoverflow, Navigation]}
        className="w-full px-2 sm:px-4"
        style={{ paddingBottom: "24px", height: '50vh' }}
      >
        {destinations.map((dest) => (
          <SwiperSlide
            key={dest.name}
            className="flex flex-col items-center justify-end bg-white rounded-3xl shadow-lg overflow-hidden relative w-[83vw] h-full max-w-[320px] sm:w-[320px]"
            style={{ height: '50vh', minHeight: '50vh' }}
          >
            <img
              src={dest.image}
              alt={dest.name}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{ filter: "brightness(0.85)" }}
            />
            <div className="absolute inset-0 bg-black/10 z-10" />
            <div className="relative z-20 flex flex-col justify-end h-full w-full p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <button className="bg-white/80 text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-semibold text-xs sm:text-sm shadow">DRAG</button>
              </div>
              <div className="mt-auto">
                <div className="text-white text-lg sm:text-xl font-bold mb-1">{dest.name}</div>
                <div className="text-white text-xs sm:text-sm mb-4">{dest.listings} Listing</div>
                <button 
                  className="bg-white/90 text-black font-bold px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm shadow hover:bg-orange-600 hover:text-white transition"
                  onClick={() => handleViewAll(dest.route)}
                >
                  View All
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default PopularDestinations; 