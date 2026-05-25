import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

const UserDetails = () => {
  const navigate = useNavigate();
  const { booking, updateContact } = useBooking();
  const { tour, tickets = 1, date, time, contact, flexibility } = booking || {};
  const [fullName, setFullName] = useState(contact?.fullName || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [country, setCountry] = useState(contact?.country || "Pakistan (+92)");
  const [phone, setPhone] = useState(contact?.phone || "");

  useEffect(() => {
    updateContact({ fullName, email, country, phone });
  }, [fullName, email, country, phone]);

  if (!tour) {
    return <div className="text-center mt-20 text-xl text-red-600">No tour selected for contact. Please go back and try again.</div>;
  }

  const steps = ["Flexibility", "User Details", "Payment"];
  const currentStep = 2;

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      {/* Step Progress Bar */}
      <div className="flex justify-center items-center gap-8 mb-8 w-full max-w-3xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (idx === 0) navigate("/flexibility");
            if (idx === 1 && flexibility) navigate("/userDetails");
            if (idx === 2 && flexibility) navigate("/payment");
          }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg border-2 ${idx + 1 === currentStep ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-700'}`}>{idx + 1}</div>
            <span className={`font-semibold ${idx + 1 === currentStep ? 'text-blue-700' : 'text-gray-500'}`}>{step}</span>
            {idx < steps.length - 1 && <div className="w-8 h-1 bg-blue-200 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto">
        {/* Left: Personal Details Form */}
        <div className="flex-1 bg-white rounded-xl shadow p-6 mb-8 md:mb-0">
          <div className="mb-4 text-lg font-bold">Enter your personal details</div>
          <div className="mb-2 text-green-700 flex items-center gap-2"><span className="material-icons text-green-700">lock</span> Checkout is fast and secure</div>
          <form className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Full name*</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email*</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Country*</label>
              <select className="w-full border rounded px-3 py-2" value={country} onChange={e => setCountry(e.target.value)}>
                <option>Pakistan (+92)</option>
                <option>India (+91)</option>
                <option>USA (+1)</option>
                <option>UK (+44)</option>
                {/* Add more countries as needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Mobile phone number*</label>
              <input type="tel" className="w-full border rounded px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="text-xs text-gray-500 mt-1">We'll only contact you with essential updates or changes to your booking</div>
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-4 transition"
              onClick={() => navigate("/payment")}
            >
              Go to payment
            </button>
          </form>
          <div className="mt-6 text-green-700 flex items-center gap-2"><span className="material-icons text-green-700">check_circle</span> Free cancellation <span className="text-gray-700">Until 10:00 AM on August 11</span></div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full md:w-[400px] bg-white rounded-xl shadow p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-4">
            {tour?.images && tour.images[0] && (
              <img src={tour.images[0]} alt={tour.title || tour.name} className="w-16 h-16 object-cover rounded" />
            )}
            <div>
              <div className="font-bold text-lg">{tour.title || tour.name}</div>
              <div className="text-yellow-600 text-sm">★ 4.9 (3,396)</div>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">Top rated</div>
            </div>
          </div>
          <div className="border-b pb-2 mb-2">
            <div className="text-sm">Language: English</div>
            <div className="text-sm">{date || "Date not selected"}</div>
            <div className="text-sm">{tickets} adult{tickets > 1 ? "s" : ""} (Age 13 - 99)</div>
            <button className="text-blue-600 underline text-xs mt-1">Change date or participants</button>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-green-700">Free cancellation</span>
            <span className="text-green-700">Great value</span>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <input type="text" placeholder="Enter promo, credit, or gift code" className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-between items-center mt-4 font-bold text-lg">
            <span>Total</span>
            <span>{tour.currency || "$"}{(tour.price * tickets).toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500 text-right">All taxes and fees included</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 