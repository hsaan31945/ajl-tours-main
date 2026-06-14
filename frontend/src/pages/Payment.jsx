import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CheckCircle, Lock } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../utils/api";
import { getTourId } from "../utils/tourId";
import { calculateBookingPricing, getGroupDiscountLabel } from "../utils/bookingPricing";
import { cleanDisplayName } from "../utils/textFormatting";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
}
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const getStoredCheckoutData = () => {
  const tryParse = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  };

  return tryParse("recentTourData") || tryParse("currentTourData") || {};
};

const buildBookingPayload = ({ booking, tour, pricing }) => {
  const stored = getStoredCheckoutData();
  const contact = booking?.contact || {};
  const selectedDate = booking?.date || stored.selectedDate || stored.date || new Date().toISOString().split("T")[0];
  const tickets = Number(pricing?.tickets || booking?.tickets || stored.tickets || 1);

  return {
    name: contact.fullName || stored.userName || stored.name || "Guest customer",
    email: contact.email || stored.userEmail || stored.email || "",
    phone: contact.phone || stored.userPhone || stored.phone || "",
    address: contact.pickupAddress || stored.pickupAddress || stored.address || "",
    pickupAddress: contact.pickupAddress || stored.pickupAddress || stored.address || "",
    tourId: getTourId(tour) || stored.tourId,
    tickets,
    travelers: tickets,
    selectedDate,
    tripDate: selectedDate,
    specialRequests: stored.specialRequests || "",
    flexibility: booking?.flexibility || stored.flexibility || "standard",
  };
};

const PaymentForm = ({ clientSecret, paymentSummary }) => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { tour, tickets = 1, date, time, contact, flexibility } = booking || {};
  const stripe = useStripe();
  const elements = useElements();
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const displayPricing = paymentSummary || calculateBookingPricing({ tour, tickets, selectedDate: date, flexibility });
  const totalPrice = Number(displayPricing.total || displayPricing.amount || 0);
  const displayTickets = Number(displayPricing.tickets || tickets || 1);
  const tourName = cleanDisplayName(tour?.title || tour?.name || "Tour");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError(t("payment.notReady"));
      setLoading(false);
      return;
    }

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message);
        setLoading(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?payment_intent=${clientSecret.split('_secret_')[0]}`,
        },
      });

      if (confirmError) {
        // Payment failed - redirect to failure page
        console.error('Payment failed:', confirmError);
        navigate('/payment-failure', { 
          state: { 
            error: confirmError.message,
            paymentIntentId: clientSecret.split('_secret_')[0]
          }
        });
        return;
      } else {
        // Payment is being processed - Stripe will redirect to success page
        console.log('Payment processing - redirecting to success page');
        return;
      }
    } catch (err) {
      setError(t("payment.failed"));
      setLoading(false);
    }
  };

  if (!tour) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("payment.noTourTitle")}</h2>
          <p className="text-gray-600 mb-6">{t("payment.noTourText")}</p>
          <button
            type="button"
            onClick={() => navigate("/switzerland")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            {t("common.viewTours")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t("payment.title")}</h1>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{t("payment.details")}</h2>
            
            {/* Tour Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold">{tourName}</h3>
              <p className="text-gray-600">{date} • {time}</p>
              <p className="text-gray-600">{displayTickets} adult{displayTickets > 1 ? "s" : ""} • {formatPrice(totalPrice)}</p>
              {displayPricing.hasGroupDiscount && (
                <p className="text-sm font-semibold text-green-700">
                  {getGroupDiscountLabel(displayPricing, displayTickets)}: -{formatPrice(displayPricing.groupDiscountTotal || 0)}
                </p>
              )}
              </div>

            {/* Payment Form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("payment.information")}
              </label>
              <div className="border border-gray-300 rounded-lg p-4">
                <PaymentElement />
              </div>
              </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:border-white hover:text-white disabled:bg-gray-400 disabled:border-gray-400 disabled:text-gray-400 font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t("payment.processing")}
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {t("common.pay")} {formatPrice(totalPrice)}
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t("payment.secureNotice")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FreeCheckoutForm = ({ paymentSummary }) => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  const { tour, tickets = 1, date, time, flexibility } = booking || {};
  const displayPricing = paymentSummary || calculateBookingPricing({ tour, tickets, selectedDate: date, flexibility });
  const totalPrice = Number(displayPricing.total || displayPricing.amount || 0);
  const displayTickets = Number(displayPricing.tickets || tickets || 1);
  const tourName = cleanDisplayName(tour?.title || tour?.name || "Tour");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFreeBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      const bookingData = buildBookingPayload({ booking, tour, pricing: displayPricing });
      if (!bookingData.email) {
        throw new Error("Please go back and enter your contact details before completing this booking.");
      }

      const response = await axios.post(apiUrl('/api/confirm-free-booking'), {
        tourId: getTourId(tour),
        tickets: displayTickets,
        selectedDate: date,
        flexibility,
        bookingData,
      });

      const databaseBooking = response.data?.booking?.data || response.data?.booking || response.data?.data || null;
      const bookingId = databaseBooking?._id || databaseBooking?.id || response.data?.paymentIntentId || `FREE${Date.now()}`;
      const stored = getStoredCheckoutData();
      const successData = {
        ...stored,
        ...bookingData,
        tourName,
        amount: Number(databaseBooking?.totalPrice ?? 0),
        tickets: Number(databaseBooking?.travelers ?? displayTickets),
        tourId: bookingData.tourId,
        currency: databaseBooking?.paymentCurrency || displayPricing.currency || stored.currency || "CHF",
        selectedDate: bookingData.selectedDate,
        date: bookingData.selectedDate,
        time: time || stored.time || "09:00",
        groupDiscountTier: databaseBooking?.groupDiscountTier || displayPricing.groupDiscountTier || null,
        groupDiscountUnitAmount: Number(databaseBooking?.groupDiscountUnitAmount ?? displayPricing.groupDiscountUnitAmount ?? 0),
        groupDiscountTotal: Number(databaseBooking?.groupDiscountTotal ?? displayPricing.groupDiscountTotal ?? 0),
        groupDiscountPercent: Number(databaseBooking?.groupDiscountPercent ?? displayPricing.groupDiscountPercent ?? 0),
        hasGroupDiscount: Number(databaseBooking?.groupDiscountTotal ?? displayPricing.groupDiscountTotal ?? 0) > 0,
        paymentMethod: "Free checkout",
        status: databaseBooking?.status || "Pending",
      };

      navigate(`/payment-success?free_checkout=1&booking_id=${encodeURIComponent(bookingId)}`, {
        state: {
          freeCheckout: true,
          bookingId,
          bookingData: successData,
          databaseBooking,
          paymentIntentId: response.data?.paymentIntentId,
        },
      });
    } catch (err) {
      console.error('Error completing free booking:', err);
      const apiMessage = err.response?.data?.error || err.response?.data?.message;
      setError(apiMessage || err.message || "Could not complete this booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!tour) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("payment.noTourTitle")}</h2>
          <p className="text-gray-600 mb-6">{t("payment.noTourText")}</p>
          <button
            type="button"
            onClick={() => navigate("/switzerland")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            {t("common.viewTours")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">{t("payment.title")}</h1>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">{t("payment.details")}</h2>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold">{tourName}</h3>
              <p className="text-gray-600">{date} • {time}</p>
              <p className="text-gray-600">{displayTickets} adult{displayTickets > 1 ? "s" : ""} • {formatPrice(totalPrice)}</p>
              <p className="text-sm font-semibold text-green-700 mt-2">No card required for this 100% discount.</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              onClick={handleFreeBooking}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t("payment.processing")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Payment = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [freeCheckout, setFreeCheckout] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [freshTour, setFreshTour] = useState(null);
  const [tourRefreshComplete, setTourRefreshComplete] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const { booking, updateTour } = useBooking();
  const { t } = useI18n();
  const { tour: bookingTour, tickets = 1, date, flexibility } = booking || {};
  const tour = freshTour || bookingTour;
  const bookingTourId = getTourId(bookingTour);

  const pricing = calculateBookingPricing({ tour, tickets, selectedDate: date, flexibility });
  const minTickets = pricing.minTickets;
  const currentTickets = pricing.tickets;
  const totalPrice = pricing.total;

  useEffect(() => {
    if (!bookingTourId) {
      setTourRefreshComplete(true);
      return;
    }

    let cancelled = false;
    const refreshTour = async () => {
      try {
        setIsLoading(true);
        setTourRefreshComplete(false);
        const response = await fetch(apiUrl(`/api/tours/${bookingTourId}`), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        if (!response.ok) throw new Error(`Failed to refresh tour (${response.status})`);
        const data = await response.json();
        if (!cancelled) {
          setFreshTour(data);
          updateTour(data);
          setTourRefreshComplete(true);
        }
      } catch (error) {
        console.error('Failed to refresh MongoDB tour for payment:', error);
        if (!cancelled) {
          setError('Could not verify the latest tour details from MongoDB. Please go back and try again.');
          setTourRefreshComplete(true);
          setIsLoading(false);
        }
      }
    };

    refreshTour();
    return () => {
      cancelled = true;
    };
  }, [bookingTourId, updateTour]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!tourRefreshComplete) return;
      if (error) {
        setIsLoading(false);
        return;
      }
      if (!tour) {
        setError("No MongoDB tour selected for payment.");
        setIsLoading(false);
        return;
      }
      if (!pricing.validTickets) {
        setError(`Minimum ${minTickets} tickets are required for this tour.`);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError("");
        const response = await axios.post(apiUrl('/api/create-payment-intent'), {
          tourId: getTourId(tour),
          tickets: currentTickets,
          selectedDate: date,
          flexibility,
        });
        const summary = {
          ...(response.data?.pricing || {}),
          total: Number(response.data?.amount ?? response.data?.pricing?.total ?? totalPrice),
          currency: response.data?.currency || pricing.currency,
          tickets: response.data?.pricing?.tickets || currentTickets,
        };
        setPaymentSummary(summary);
        if (response?.data?.freeCheckout || Number(response?.data?.amount ?? summary.total) <= 0) {
          setFreeCheckout(true);
          setClientSecret("");
          return;
        }
        const cs = response?.data?.clientSecret || response?.data?.client_secret;
        if (!cs) throw new Error('No client secret returned');
        setFreeCheckout(false);
        setClientSecret(cs);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        const apiMessage = err.response?.data?.error || err.response?.data?.message;
        setError(
          apiMessage ||
            "Payment system temporarily unavailable. Please try again later or contact support."
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!tourRefreshComplete) {
      return;
    }

    if (tour) {
      createPaymentIntent();
    } else {
      setIsLoading(false);
    }
  }, [tourRefreshComplete, tour, currentTickets, minTickets, pricing.validTickets, pricing.currency, totalPrice, date, flexibility, error]);

  if (!publishableKey && !freeCheckout && !isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("payment.configError")}</h2>
          <p className="text-gray-600 mb-6">
            {t("payment.configText")}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("payment.initializing")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("payment.systemError")}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              {t("payment.tryAgain")}
            </button>
            <button 
              onClick={() => window.history.back()} 
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              {t("common.goBack")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    if (freeCheckout) {
      return <FreeCheckoutForm paymentSummary={paymentSummary} />;
    }

    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("payment.setupFailed")}</h2>
          <p className="text-gray-600 mb-6">{t("payment.setupFailedText")}</p>
          <button 
            onClick={() => window.history.back()} 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            {t("common.goBack")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm clientSecret={clientSecret} paymentSummary={paymentSummary} />
    </Elements>
  );
};

export default Payment; 
