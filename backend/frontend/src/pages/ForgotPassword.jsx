import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const generateOTP = () => {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const trimmed = (email || '').trim();
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!trimmed || !emailRegex.test(trimmed)) {
        setError('Please enter a valid email address.');
        return;
      }
      // Generate OTP
      const otp = generateOTP();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      
      const response = await fetch(apiUrl('/api/auth/send-reset-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          otp,
          expiresAt: expiryTime.toLocaleString(),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Please try again.');
      }

      // Store OTP in localStorage temporarily (current verification page reads it here)
      localStorage.setItem('resetOTP', JSON.stringify({
        otp,
        email: trimmed,
        expiry: expiryTime.getTime(),
        attempts: 0
      }));
      
      setEmailSent(true);
      setMessage('OTP sent successfully! Check your email.');
      
      // Redirect to OTP verification page after 2 seconds
      setTimeout(() => {
        window.location.href = `/verify-otp?email=${encodeURIComponent(trimmed)}`;
      }, 2000);

    } catch (error) {
      console.error('Error sending OTP:', error);
      setError(error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link 
              to="/login" 
              className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-orange-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {emailSent ? 'Check Your Email' : 'Forgot Password?'}
            </h1>
            
            <p className="text-gray-600">
              {emailSent 
                ? 'We\'ve sent a 6-digit code to your email address.'
                : 'Enter your email address and we\'ll send you a code to reset your password.'
              }
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={sendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-600 font-medium mb-4">{message}</p>
              <p className="text-sm text-gray-500">
                Redirecting to verification page...
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Remember your password?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
