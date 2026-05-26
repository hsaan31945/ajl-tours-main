import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Download, Mail, Home } from "lucide-react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { apiUrl } from "../utils/api";
import { calculateBookingPricing } from "../utils/bookingPricing";

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
        
        const tickets = d.tickets ?? d.participants ?? 1;
        const flexibility = d.flexibility || 'standard';
        const pricing = calculateBookingPricing({
          tour: {
            price: d.tourPrice ?? d.amount ?? 0,
            currency: d.tourCurrency || d.currency || 'CHF',
            minTicketsPerBooking: d.minTicketsPerBooking || 1,
          },
          tickets,
          selectedDate: d.selectedDate || d.date,
          flexibility,
        });
        
        return {
          tourName: d.tourName || d.tourTitle || 'Tour',
          amount: pricing.total,
          tickets: pricing.tickets,
          tourId: d.tourId || 'unknown',
          currency: pricing.currency,
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

      // Use normalized checkout data if available; keep missing details neutral.
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

      // Also save to database for admin panel. The backend re-validates tour, tickets, and total.
      try {
        const paymentIntentId = new URLSearchParams(location.search).get('payment_intent');
        const bookingData = {
          name: data.userName || data.name || user?.name || "Guest User",
          email: data.userEmail || userEmail,
          phone: data.userPhone || data.phone || "",
          tourId: data.tourId || "",
          tickets: data.tickets || 1,
          travelers: data.tickets || 1,
          selectedDate: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
          tripDate: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
          specialRequests: data.specialRequests || "",
          paymentStatus: "paid",
          stripePaymentId: paymentIntentId || undefined,
          flexibility: data.flexibility || "standard"
        };

        const response = await fetch(apiUrl('/api/bookings'), {
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
              <span className="font-semibold">{bookingData?.tourName || "Tour"}</span>
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

        {/* Support Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team at support@tripgo.com</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 
