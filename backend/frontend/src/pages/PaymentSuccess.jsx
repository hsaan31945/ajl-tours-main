import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Download, Mail, Home } from "lucide-react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { apiUrl } from "../utils/api";
import { calculateBookingPricing, getGroupDiscountLabel } from "../utils/bookingPricing";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AppContext);
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  const [bookingData, setBookingData] = useState(null);
  const [bookingId, setBookingId] = useState("");

  const saveBookingToHistory = useCallback(async (data, id, paymentIntentId) => {
    try {
      const userEmail = user?.email || 'guest';
      const existingBookings = JSON.parse(localStorage.getItem(`bookings_${userEmail}`) || '[]');
      const bookingPayload = {
        name: data.userName || data.name || user?.name || "Guest User",
        email: data.userEmail || userEmail,
        phone: data.userPhone || data.phone || "",
        address: data.pickupAddress || data.address || "",
        tourId: data.tourId || "",
        tickets: data.tickets || 1,
        travelers: data.tickets || 1,
        selectedDate: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
        tripDate: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
        specialRequests: data.specialRequests || "",
        status: "confirmed",
        paymentStatus: "paid",
        stripePaymentId: paymentIntentId || undefined,
        flexibility: data.flexibility || "standard"
      };

      if (!paymentIntentId) {
        console.error('Payment intent ID is missing; not creating a booking without Stripe confirmation.');
        return false;
      }

      const response = await fetch(apiUrl('/api/confirm-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          bookingData: bookingPayload,
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        console.error('Failed to confirm payment and save booking:', errorPayload.error || response.statusText);
        return false;
      }

      const result = await response.json();
      const databaseBooking = result?.booking?.data || result?.booking || result?.data || null;
      
      const newBooking = {
        bookingId: id,
        databaseId: databaseBooking?._id || databaseBooking?.id || "",
        tourName: databaseBooking?.tourTitle || data.tourName || "Unknown Tour",
        amount: Number(databaseBooking?.totalPrice ?? data.amount ?? 0),
        groupDiscountTier: databaseBooking?.groupDiscountTier || data.groupDiscountTier || null,
        groupDiscountUnitAmount: Number(databaseBooking?.groupDiscountUnitAmount ?? data.groupDiscountUnitAmount ?? 0),
        groupDiscountTotal: Number(databaseBooking?.groupDiscountTotal ?? data.groupDiscountTotal ?? 0),
        groupDiscountPercent: Number(databaseBooking?.groupDiscountPercent ?? data.groupDiscountPercent ?? 0),
        hasGroupDiscount: Number(databaseBooking?.groupDiscountTotal ?? data.groupDiscountTotal ?? 0) > 0,
        tickets: Number(databaseBooking?.travelers ?? data.tickets ?? 1),
        bookingDate: new Date().toISOString(),
        tourId: data.tourId || "",
        pickupAddress: databaseBooking?.address || data.pickupAddress || data.address || "",
        currency: databaseBooking?.paymentCurrency || data.tourCurrency || data.currency || "$",
        selectedDate: data.selectedDate || data.date || new Date().toISOString().split('T')[0],
        status: "Confirmed",
        paymentMethod: "Credit Card",
        flexibility: data.flexibility || "standard"
      };
      
      const updatedBookings = [...existingBookings, newBooking];
      localStorage.setItem(`bookings_${userEmail}`, JSON.stringify(updatedBookings));
      
      console.log('Booking saved to history:', newBooking);
      console.log('All bookings for user:', updatedBookings);
      return true;
    } catch (error) {
      console.error('Error saving booking to history:', error);
      return false;
    }
  }, [user?.email, user?.name]);

  // Get tour data from localStorage (stored during checkout flow)
  useEffect(() => {
    const initializeBooking = async () => {
      const paymentIntentId = new URLSearchParams(location.search).get('payment_intent');
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
            price: d.saleUnitPrice ?? d.tourPrice ?? d.amount ?? 0,
            currency: d.tourCurrency || d.currency || 'CHF',
            minTicketsPerBooking: d.minTicketsPerBooking || 1,
            groupDiscountEnabled: d.groupDiscountEnabled === true,
            groupDiscount4: d.groupDiscount4 ?? null,
            groupDiscount5: d.groupDiscount5 ?? null,
            groupDiscount6Plus: d.groupDiscount6Plus ?? null,
          },
          tickets,
          selectedDate: d.selectedDate || d.date,
          flexibility,
        });
        
        return {
          tourName: d.tourName || d.tourTitle || 'Tour',
          amount: pricing.total,
          groupDiscountTier: pricing.groupDiscountTier || d.groupDiscountTier || null,
          groupDiscountUnitAmount: pricing.groupDiscountUnitAmount || Number(d.groupDiscountUnitAmount || 0),
          groupDiscountTotal: pricing.groupDiscountTotal || Number(d.groupDiscountTotal || 0),
          groupDiscountPercent: pricing.groupDiscountPercent || Number(d.groupDiscountPercent || 0),
          hasGroupDiscount: pricing.hasGroupDiscount || Boolean(d.hasGroupDiscount),
          tickets: pricing.tickets,
          tourId: d.tourId || 'unknown',
          currency: pricing.currency,
          selectedDate: d.selectedDate || d.date || new Date().toISOString().split('T')[0],
          time: d.time || '09:00',
          flexibility,
          minTicketsPerBooking: d.minTicketsPerBooking || 1,
          userName: d.userName || d.name || '',
          userEmail: d.userEmail || d.email || '',
          userPhone: d.userPhone || d.phone || '',
          pickupAddress: d.pickupAddress || d.address || '',
          address: d.address || d.pickupAddress || '',
          specialRequests: d.specialRequests || '',
        };
      };

      const currentParsed = normalize(tryParse(currentTourRaw));
      const recentParsed = normalize(tryParse(recentTourRaw));
      tourData = recentParsed || currentParsed;

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
        selectedDate: new Date().toISOString().split('T')[0],
        time: '09:00'
      };
    
      setBookingData(data);
    
      // Generate unique booking ID
      const id = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setBookingId(id);
    
      // Save booking to localStorage only after the backend confirms the Stripe payment.
      const saved = await saveBookingToHistory(data, id, paymentIntentId);
    
      // Clean up temp data
      if (saved) {
        localStorage.removeItem('currentTourData');
        localStorage.removeItem('recentTourData');
      }
    
      console.log('Payment success - saving booking:', data);
    };

    initializeBooking();
  }, [location.search, saveBookingToHistory, user?.email]);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("success.paymentSuccessful")}</h1>
          <p className="text-gray-600">{t("success.confirmedText")}</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t("success.bookingConfirmation")}</h2>
          <div className="text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.tourName")}</span>
              <span className="font-semibold">{bookingData?.tourName || "Tour"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.bookingId")}</span>
              <span className="font-semibold">#{bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.amountPaid")}</span>
              <span className="font-semibold">{formatPrice(bookingData?.amount || 0)}</span>
            </div>
            {bookingData?.hasGroupDiscount && (
              <div className="flex justify-between">
                <span className="text-gray-600">{getGroupDiscountLabel(bookingData, bookingData?.tickets)}:</span>
                <span className="font-semibold text-green-700">
                  -{formatPrice(bookingData?.groupDiscountTotal || 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.tickets")}</span>
              <span className="font-semibold">{bookingData?.tickets || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.status")}</span>
              <span className="text-green-600 font-semibold">{t("common.confirmed")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t("success.paymentMethod")}</span>
              <span className="font-semibold">{t("success.creditCard")}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t("success.next")}</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold">{t("success.confirmationEmail")}</h3>
                <p className="text-sm text-gray-600">{t("success.confirmationEmailText")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold">{t("success.downloadReceipt")}</h3>
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
