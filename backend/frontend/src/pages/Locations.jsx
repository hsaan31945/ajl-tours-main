import React from "react";
import { useNavigate } from "react-router-dom";
import tourImg01 from "../assets/t1.jpg";
import Button from "../components/Button";
import ImageCarousel from "../components/ImageCarousel";
import tourImg02 from "../assets/t2.jpg";
import tourImg03 from "../assets/t3.jpg";
import { useCurrency } from "../context/CurrencyContext";

const locations = [
  {
    id: "02",
    title: "Coming Soon",
    desc: "More amazing destinations will be available soon!",
    images: [tourImg01, tourImg02, tourImg03],
    available: false,
  },
];

const Locations = () => {
  const navigate = useNavigate();
  const { symbol, rate } = useCurrency();
  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-bold mb-10 text-center text-black">Select Your Location</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full max-w-3xl">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className={`rounded-xl shadow-lg bg-white p-6 flex flex-col items-center border-2 transition-transform hover:scale-105 cursor-pointer ${loc.available ? "hover:border-red-600" : "opacity-60 cursor-not-allowed"}`}
            onClick={() => loc.available && navigate("/visit-checkout-2", { state: { tour: { id: loc.id, title: loc.title, price: 15000 } } })}
          >
            <ImageCarousel images={loc.images} alt={loc.title} className="w-40 h-40 object-cover rounded-lg mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-black">{loc.title}</h2>
            <p className="text-gray-600 text-center">{loc.desc}</p>
            {loc.available && (
              <Button onClick={() => loc.available && navigate("/visit-checkout-2", { state: { tour: { id: loc.id, title: loc.title, price: 15000 } } })}>
                Go to Checkout
              </Button>
            )}
            <div className="text-lg font-bold text-red-600 mt-2">{symbol}{(15000 * rate).toFixed(2)} <span className="text-sm text-gray-500">/person</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Locations; 