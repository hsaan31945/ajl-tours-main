import React from "react";
import { useNavigate } from "react-router-dom";

const TestVisitCheckout = () => {
  const navigate = useNavigate();

  const testTours = [
    {
      id: "01",
      name: "From Zurich Full-day private tour Basel and Colmar",
      price: 250,
      currency: "CHF"
    },
    {
      id: "02", 
      name: "Swiss Alps Adventure Tour",
      price: 180,
      currency: "CHF"
    },
    {
      id: "03",
      name: "Lucerne to Interlaken Scenic Tour", 
      price: 220,
      currency: "CHF"
    },
    {
      id: "04",
      name: "Zurich City and Lake Tour",
      price: 150,
      currency: "CHF"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Visit Checkout 2.0 - Test Page</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Available Tours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testTours.map((tour) => (
              <div key={tour.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold mb-2">{tour.name}</h3>
                <p className="text-orange-600 font-bold text-xl mb-4">{tour.currency} {tour.price}</p>
                <button
                  onClick={() => navigate(`/visit-checkout-2/${tour.id}`, { 
                    state: { tour: { ...tour, images: [], duration: "10 hours", type: "Day Tour, Private Tour" } }
                  })}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition"
                >
                  Book This Tour
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">Features of Visit Checkout 2.0:</h3>
            <ul className="text-orange-700 space-y-1">
              <li>• Same processing flow as existing checkout (Flexibility → User Details → Payment)</li>
              <li>• Orange and black theme consistent with website design</li>
              <li>• Calendar date selection with pricing display</li>
              <li>• Ticket quantity selection</li>
              <li>• Tour overview and detailed information</li>
              <li>• Related tours suggestions</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVisitCheckout; 