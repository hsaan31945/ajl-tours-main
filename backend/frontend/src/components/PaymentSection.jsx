import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import PriceWithEdit from "./PriceWithEdit";
import { useAdmin } from "../context/AdminContext";

function PaymentSection({
  tourName,
  location,
  description,
  price,
  tickets,
  setTickets,
  totalPrice,
  currency,
  tour,
  date,
  time,
  onPriceUpdated,
  onSavePrice,
  onSaveMinTickets // callback to save minTickets to database
}) {
  const navigate = useNavigate();
  const { setBooking } = useBooking();
  const { isAdmin, passcodeHeader } = useAdmin();
  const [editingMinTickets, setEditingMinTickets] = useState(false);
  const [minTicketsInput, setMinTicketsInput] = useState(tour?.minTicketsPerBooking || 1);
  
  const minTickets = tour?.minTicketsPerBooking || 1;
  
  // Enforce minimum tickets
  const handleTicketsChange = (value) => {
    const numValue = Number(value);
    if (numValue >= minTickets) {
      setTickets(numValue);
    } else {
      setTickets(minTickets);
    }
  };
  
  // Save minimum tickets to database (admin only)
  const saveMinTickets = async () => {
    if (!isAdmin || !onSaveMinTickets) return;
    const success = await onSaveMinTickets(minTicketsInput);
    if (success) {
      setEditingMinTickets(false);
      // If current ticket count is below new minimum, update it
      if (tickets < minTicketsInput) {
        setTickets(minTicketsInput);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border-t-4 border-orange-600 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">{tourName}</h2>
      <p className="text-gray-600 mb-2 text-center">{location}</p>
      <p className="text-gray-700 mb-4 text-center">{description}</p>
      <div className="flex flex-col gap-2 w-full mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Price per ticket:</span>
          <div className="font-bold text-orange-600">
            <PriceWithEdit
              price={Number(price)}
              currencySymbol={currency || "CHF"}
              tourId={tour?.id}
              isAdmin={isAdmin}
              onSavePrice={onSavePrice}
              onUpdated={onPriceUpdated}
            />
          </div>
        </div>
        
        {/* Admin-only: Minimum Tickets Setting */}
        {isAdmin && (
          <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <span className="font-semibold text-yellow-700 text-sm">Min Tickets (Admin):</span>
            {editingMinTickets ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={minTicketsInput}
                  onChange={e => setMinTicketsInput(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-center text-sm"
                />
                <button
                  onClick={saveMinTickets}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingMinTickets(false);
                    setMinTicketsInput(minTickets);
                  }}
                  className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-yellow-700">{minTickets}</span>
                <button
                  onClick={() => setEditingMinTickets(true)}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  title="Edit minimum tickets"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="font-semibold">Tickets:</span>
          <input
            type="number"
            min={minTickets}
            value={tickets}
            onChange={e => handleTicketsChange(e.target.value)}
            className="w-16 border rounded px-2 py-1 text-center"
          />
        </div>
        {!isAdmin && minTickets > 1 && (
          <p className="text-xs text-gray-500 text-right">Minimum {minTickets} tickets required</p>
        )}
        <div className="flex justify-between mt-2">
          <span className="font-bold text-lg">Total:</span>
          <span className="font-bold text-orange-600 text-2xl">{(currency || "CHF")}{totalPrice}</span>
        </div>
      </div>
      <button
        type="button"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl mt-4 transition"
        onClick={() => {
          setBooking({ tour, tickets, date, time });
          navigate("/flexibility");
        }}
      >
        Pay
      </button>
    </div>
  );
}

export default PaymentSection; 
