import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";

const BookingHistory = () => {
  const { user } = useContext(AppContext);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    try {
      const userEmail = user?.email || 'guest';
      const storedBookings = localStorage.getItem(`bookings_${userEmail}`);
      if (storedBookings) {
        setBookingHistory(JSON.parse(storedBookings));
      }
    } catch (_) {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.email]);

  return (
    <div className="w-full min-h-screen bg-white text-black flex justify-center">
      <div className="w-full max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-6">Your Booking History</h1>
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">History</h2>
            <button
              onClick={() => {
                const userEmail = user?.email || 'guest';
                localStorage.removeItem(`bookings_${userEmail}`);
                window.location.reload();
                alert('Old booking data cleared!');
              }}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              🧹 Clear Old Data
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your booking history...</p>
            </div>
          ) : bookingHistory.length > 0 ? (
            <div className="space-y-4">
              {bookingHistory.map((booking, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">{booking.tourName}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="mr-4">📅 {new Date(booking.bookingDate).toLocaleDateString()}</span>
                        <span className="mr-4">💰 {booking.currency || "$"}{Number(booking.amount || 0).toFixed(2)}</span>
                        {Number(booking.groupDiscountTotal || 0) > 0 && (
                          <span className="mr-4 text-green-700">
                            Group discount -{booking.currency || "$"}{Number(booking.groupDiscountTotal).toFixed(2)}
                          </span>
                        )}
                        <span className="mr-4">👥 {booking.tickets} {booking.tickets > 1 ? 'people' : 'person'}</span>
                        <span className="text-green-600 font-semibold">✅ Confirmed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Booking ID</div>
                      <div className="font-mono text-sm">{booking.bookingId}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold mb-2">No Previous Bookings</h3>
              <p>Make your first booking to see it here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;


