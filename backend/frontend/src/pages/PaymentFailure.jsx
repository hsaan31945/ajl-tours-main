import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, Home, CreditCard } from "lucide-react";

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      <div className="max-w-2xl mx-auto text-center">
        {/* Failure Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">We were unable to process your payment. Please try again.</p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">What went wrong?</h2>
          <div className="text-left space-y-3">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <h3 className="font-semibold">Payment Processing Error</h3>
                <p className="text-sm text-gray-600">Your payment could not be completed. This might be due to insufficient funds, incorrect card details, or bank restrictions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-orange-600 mt-1" />
              <div>
                <h3 className="font-semibold">Try Again</h3>
                <p className="text-sm text-gray-600">You can retry the payment with the same or different payment method.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Common Solutions */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Common Solutions</h2>
          <div className="text-left space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">Check Your Card Details</h3>
              <p className="text-sm text-blue-600">Ensure your card number, expiry date, and CVV are correct.</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">Verify Available Funds</h3>
              <p className="text-sm text-green-600">Make sure you have sufficient funds in your account.</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Contact Your Bank</h3>
              <p className="text-sm text-yellow-600">Your bank might have blocked the transaction for security reasons.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/payment")}
            className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition"
          >
            <RefreshCw className="w-5 h-5" />
            Try Payment Again
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-orange-600 font-bold py-3 px-6 rounded-xl border border-orange-600 transition"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Still having trouble? Contact our support team at support@tripgo.com</p>
          <p className="mt-2">We're here to help you complete your booking!</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;





