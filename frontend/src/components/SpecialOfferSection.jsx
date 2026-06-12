import React from "react";

const offerBg = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
const benefitCards = [
  {
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    title: "A Taste of Paradise: Exploring the Stunning Beaches of Brazil",
    author: "Emma Clark",
  },
  {
    img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
    title: "The Joys of Solo Travel: Embracing Independence and Discovery",
    author: "Emma Clark",
  },
  {
    img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=400&q=80",
    title: "A Glorious Getaway at Sherwood Minamar Beach",
    author: "Emma Clark",
  },
];

const SpecialOfferSection = () => (
  <section className="w-full bg-white pt-16 pb-8">
    {/* Offer Banner */}
    <div
      className="rounded-2xl overflow-hidden relative flex flex-col items-center justify-center text-center mx-auto max-w-5xl min-h-[320px] mb-16"
      style={{ backgroundImage: `url(${offerBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10 p-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Get Special Offer</h2>
        <p className="text-white mb-4">Save up to 40% off on your next adventure. Limited time only!</p>
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-black transition-colors">Booking Now</button>
        <div className="text-7xl font-extrabold text-white mt-6 drop-shadow-lg">40% <span className="text-3xl align-top">Off</span></div>
      </div>
    </div>

    {/* Testimonial */}
    <div className="max-w-3xl mx-auto mb-16">
      <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <h3 className="text-xl font-bold mb-4 text-black">What Our Happy Client Say.</h3>
        <div className="text-gray-700 text-center mb-4">
          “Booking with this travel agency was a game changer! Their meticulous planning and personalized approach made our trip not just a vacation but a collection of unforgettable moments. From seamless logistics to local insights, they turned our travel dreams into reality, earning our trust and loyalty.”
        </div>
        <div className="flex items-center gap-3 mt-2">
          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="client" className="w-10 h-10 rounded-full border-2 border-red-600" />
          <div>
            <div className="font-semibold text-black">TASHA STEWART</div>
            <div className="text-xs text-gray-500">Solo Traveler</div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-yellow-400 text-lg">★</span>
          <span className="ml-2 text-gray-500 text-sm">4.9 (234 reviews)</span>
        </div>
      </div>
    </div>

    {/* Travel Benefits */}
    <div className="max-w-6xl mx-auto mb-12">
      <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-black">Explore Exceptional Travel Benefit</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {benefitCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <img src={card.img} alt={card.title} className="w-full h-48 object-cover" />
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="font-semibold text-lg mb-2 text-black">{card.title}</h4>
              <div className="text-gray-500 text-sm mt-auto">By {card.author}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-8">
        <button className="px-8 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-black transition-colors">View All Blog</button>
      </div>
    </div>
  </section>
);

export default SpecialOfferSection; 