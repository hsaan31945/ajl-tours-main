import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock, CreditCard } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../utils/api";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!publishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is not set');
}
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const PaymentForm = ({ clientSecret }) => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { tour, tickets = 1, date, time, contact, flexibility } = booking || {};
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pricePerTicket = tour?.price || 35;
  const upgradePrice = Math.round(pricePerTicket * 1.225 * 100) / 100;
  const basePrice = flexibility === "upgrade" ? upgradePrice : pricePerTicket;
  const totalPrice = basePrice * tickets;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError('Payment system not ready. Please try again.');
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
      setError('Payment processing failed. Please try again.');
      setLoading(false);
    }
  };

  if (!tour) {
    // For testing purposes, create a default tour if none exists
    const defaultTour = {
      title: "Test Tour",
      name: "Test Tour", 
      price: 100,
      id: "test-tour"
    };
    
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Payment Test</h1>
          
          <div className="bg-white rounded-xl shadow p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
              
              {/* Tour Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-bold">{defaultTour.title}</h3>
                <p className="text-gray-600">Test Date • 09:00</p>
                <p className="text-gray-600">1 ticket(s) • $100.00</p>
              </div>

              {/* Payment Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Information
                </label>
                <div className="border border-gray-300 rounded-lg p-4">
                  <PaymentElement />
                </div>
              </div>

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
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay $100.00
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Your payment will be processed securely by Stripe. We never store your card details.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Payment</h1>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Payment Details</h2>
            
            {/* Tour Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold">{tour.title || tour.name}</h3>
              <p className="text-gray-600">{date} • {time}</p>
              <p className="text-gray-600">{tickets} ticket(s) • ${totalPrice.toFixed(2)}</p>
              </div>

            {/* Payment Form */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Information
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
                  Processing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Pay ${totalPrice.toFixed(2)}
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Your payment will be processed securely by Stripe. We never store your card details.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Payment = () => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(!publishableKey);
  const { booking } = useBooking();
  const { tour, tickets = 1, flexibility } = booking || {};

  const pricePerTicket = tour?.price || 35;
  const upgradePrice = Math.round(pricePerTicket * 1.225 * 100) / 100;
  const basePrice = flexibility === "upgrade" ? upgradePrice : pricePerTicket;
  const totalPrice = basePrice * tickets;

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError("");
        console.log('Creating payment intent for amount:', totalPrice);
        const response = await axios.post(apiUrl('/api/create-payment-intent'), {
          amount: Number(totalPrice),
          currency: 'usd',
          metadata: {
            tourId: tour?.id,
            tourName: tour?.title || tour?.name,
            tickets: tickets,
            flexibility: flexibility
          }
        });
        const cs = response?.data?.clientSecret || response?.data?.client_secret;
        if (!cs) throw new Error('No client secret returned');
        console.log('Payment intent created successfully:', response.data);
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

    if (totalPrice > 0 && tour) {
      createPaymentIntent();
    } else {
      setIsLoading(false);
    }
  }, [totalPrice, tour, tickets, flexibility]);

  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Configuration Error</h2>
          <p className="text-gray-600 mb-6">
            Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY in your environment.
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
          <p className="text-gray-600">Initializing payment system...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment System Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Try Again
            </button>
            <button 
              onClick={() => window.history.back()} 
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-2 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Setup Failed</h2>
          <p className="text-gray-600 mb-6">Unable to initialize payment system. Please check your tour selection and try again.</p>
          <button 
            onClick={() => window.history.back()} 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm clientSecret={clientSecret} />
    </Elements>
  );
};

export default Payment; 