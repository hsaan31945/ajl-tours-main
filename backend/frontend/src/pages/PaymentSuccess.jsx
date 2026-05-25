import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Download, Mail, Home } from "lucide-react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AppContext);
  const [bookingData, setBookingData] = useState(null);
  const [bookingId, setBookingId] = useState("");

  // Get tour data from localStorage (stored during checkout flow)
  useEffect(() => {
    const initializeBooking = async () => {
      // Prefer data set at availability/visit checkout
      const currentTourRaw = localStorage.getItem('currentTourData');
      // Fallback to data saved at user details step
      const recentTourRaw = localStorage.getItem('recentTourData');
      let tourData = null;

      const userEmail = user?.email || 'guest';
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userEmail}`) || '[]');

      const tryParse = (raw) => {
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
      };

      const normalize = (d) => {
        if (!d) return null;
        
        // Calculate the correct total price based on flexibility
        let totalAmount = d.tourPrice ?? d.amount ?? 0;
        const tickets = d.tickets ?? d.participants ?? 1;
        const flexibility = d.flexibility || 'standard';
        
        // If we have flexibility info, recalculate the total
        if (flexibility === 'upgrade' && d.tourPrice) {
          const upgradePrice = Math.round(d.tourPrice * 1.225 * 100) / 100;
          totalAmount = upgradePrice * tickets;
        } else if (d.tourPrice) {
          totalAmount = d.tourPrice * tickets;
        }
        
        return {
          tourName: d.tourName || d.tourTitle || 'Tour',
          amount: totalAmount,
          tickets: tickets,
          tourId: d.tourId || 'unknown',
          currency: d.tourCurrency || d.currency || '$',
          selectedDate: d.selectedDate || d.date || new Date().toLocaleDateString(),
          time: d.time || '09:00',
          flexibility: flexibility
        };
      };

      const currentParsed = normalize(tryParse(currentTourRaw));
      const recentParsed = normalize(tryParse(recentTourRaw));
      tourData = currentParsed || recentParsed;

      if (tourData) {
        // Prevent duplicates if user refreshed
        const alreadyExists = existingBookings.some(booking =>
          booking.tourName === tourData.tourName &&
          booking.selectedDate === tourData.selectedDate &&
          Math.abs(new Date(booking.bookingDate) - new Date()) < 300000
        );
        if (alreadyExists) {
          setBookingData(tourData);
          setBookingId(existingBookings.find(b =>
            b.tourName === tourData.tourName &&
            b.selectedDate === tourData.selectedDate
          )?.bookingId || 'EXISTING');
          return;
        }
      }

      // Use normalized data if available, otherwise fallback
      const data = tourData || {
        tourName: 'Tour',
        amount: 0,
        tickets: 1,
        tourId: 'unknown',
        currency: '$',
        selectedDate: new Date().toLocaleDateString(),
        time: '09:00'
      };
    
      setBookingData(data);
    
      // Generate unique booking ID
      const id = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setBookingId(id);
    
      // Save booking to localStorage and database
      await saveBookingToHistory(data, id);
    
      // Clean up temp data
      localStorage.removeItem('currentTourData');
      localStorage.removeItem('recentTourData');
    
      console.log('Payment success - saving booking:', data);
    };

    initializeBooking();
  }, [user?.email]);

  // Save successful booking to user's history and database
  const saveBookingToHistory = async (data, id) => {
    try {
      const userEmail = user?.email || 'guest';
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userEmail}`) || '[]');
      
      const newBooking = {
        bookingId: id,
        tourName: data.tourName || "Unknown Tour",
        amount: data.amount || 0, // Use the calculated total amount
        tickets: data.tickets || 1,
        bookingDate: new Date().toISOString(),
        tourId: data.tourId || "",
        currency: data.tourCurrency || data.currency || "$",
        selectedDate: data.selectedDate || data.date || new Date().toLocaleDateString(),
        status: "Confirmed",
        paymentMethod: "Credit Card",
        flexibility: data.flexibility || "standard"
      };
      
      const updatedBookings = [...existingBookings, newBooking];
      localStorage.setItem(`bookings_${userEmail}`, JSON.stringify(updatedBookings));
      
      console.log('Booking saved to history:', newBooking);
      console.log('All bookings for user:', updatedBookings);

      // Also save to database for admin panel
      try {
        const bookingData = {
          user_name: data.userName || data.name || "Guest User",
          email: data.userEmail || userEmail,
          phone: data.userPhone || data.phone || "",
          tour_name: data.tourName || "Unknown Tour",
          tour_id: data.tourId || "",
          tour_date: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
          tour_time: data.selectedTime || data.time || "09:00",
          number_of_tickets: data.tickets || 1,
          total_price: data.amount || 0, // Use the calculated total amount
          currency: data.tourCurrency || data.currency || "USD",
          special_requests: data.specialRequests || "",
          payment_method: "Credit Card",
          payment_status: "paid"
        };

        const apiUrl = process.env.NODE_ENV === 'production' 
          ? '/api/bookings' 
          : '/api/bookings';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Booking saved to database:', result);
        } else {
          console.error('Failed to save booking to database:', response.statusText);
        }
      } catch (dbError) {
        console.error('Error saving booking to database:', dbError);
        // Don't fail the whole process if database save fails
      }
    } catch (error) {
      console.error('Error saving booking to history:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your booking has been confirmed and payment processed.</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Booking Confirmation</h2>
          <div className="text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Tour Name:</span>
              <span className="font-semibold">{bookingData?.tourName || "Switzerland Tour"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID:</span>
              <span className="font-semibold">#{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold">${bookingData?.amount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tickets:</span>
              <span className="font-semibold">{bookingData?.tickets || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-semibold">Confirmed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">Credit Card</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold">Confirmation Email</h3>
                <p className="text-sm text-gray-600">You'll receive a confirmation email with all booking details within the next few minutes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold">Download Receipt</h3>
                <p className="text-sm text-gray-600">Your receipt has been sent to your email address for your records.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
          <button
            onClick={() => navigate("/tours")}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-orange-600 font-bold py-3 px-6 rounded-xl border border-orange-600 transition"
          >
            Browse More Tours
          </button>
        </div>

        {/* Debug Button - Remove this after testing */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">🧪 Debug: Clear old booking data to test fresh bookings</p>
          <button
            onClick={() => {
              const userEmail = user?.email || 'guest';
              localStorage.removeItem(`bookings_${userEmail}`);
              alert('Old booking data cleared! Now test with a fresh booking.');
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
          >
            🧹 Clear Old Booking Data
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team at support@tripgo.com</p>
        </div>
        
        {/* Debug: Add Test Switzerland Tour */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug: Add Test Tour</h3>
          <button 
            onClick={async () => {
              const testData = {
                tourName: "Swiss Alps Tour",
                amount: 15000,
                tickets: 1,
                tourId: "switzerland-alps",
                currency: "$",
                date: new Date().toLocaleDateString(),
                time: "09:00"
              };
              await saveBookingToHistory(testData, `BK${Date.now()}TEST`);
              alert('Test tour added! Check checkout page and admin panel.');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Add Test Switzerland Tour
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 