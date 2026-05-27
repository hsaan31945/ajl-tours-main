import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../utils/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(900);
  const [canResend, setCanResend] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const otpString = otp.join('');
      const storedData = localStorage.getItem('resetOTP');
      if (!storedData) {
        setError('OTP session expired. Please request a new code.');
        return;
      }
      const { otp: storedOTP, email: storedEmail, expiry, attempts } = JSON.parse(storedData);
      if (Date.now() > expiry) {
        setError('OTP has expired. Please request a new code.');
        localStorage.removeItem('resetOTP');
        return;
      }
      if (storedEmail !== email) {
        setError('Invalid email. Please try again.');
        return;
      }
      if (attempts >= 3) {
        setError('Too many failed attempts. Please request a new code.');
        localStorage.removeItem('resetOTP');
        return;
      }
      if (otpString === storedOTP) {
        setOtpVerified(true);
        setMessage('OTP verified successfully!');
        localStorage.removeItem('resetOTP');
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&verified=true`);
        }, 2000);
      } else {
        const updatedData = {
          ...JSON.parse(storedData),
          attempts: attempts + 1,
        };
        localStorage.setItem('resetOTP', JSON.stringify(updatedData));
        setError('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
      const response = await fetch(apiUrl('/api/auth/send-reset-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: newOtp,
          expiresAt: expiryTime.toLocaleString(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Please try again.');
      }
      localStorage.setItem('resetOTP', JSON.stringify({
        otp: newOtp,
        email,
        expiry: expiryTime.getTime(),
        attempts: 0,
      }));
      setMessage('New OTP sent successfully!');
      setTimeLeft(900);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (otpVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">OTP Verified!</h1>
            <p className="text-green-600 font-medium mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting to reset password page...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Link to="/forgot-password" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
            <p className="text-gray-600 mb-2">Enter the 6-digit code sent to</p>
            <p className="text-orange-600 font-medium">{email}</p>
          </div>

          <form onSubmit={verifyOTP} className="space-y-6">
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
                />
              ))}
            </div>

            <div className="text-center mb-4">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-500">
                  Code expires in <span className="font-medium text-orange-600">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-500">Code has expired</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                <p className="text-green-600 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.some((d) => d === '')}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
              <button
                type="button"
                onClick={resendOTP}
                disabled={!canResend || loading}
                className="text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canResend ? 'Resend Code' : 'Resend in ' + formatTime(timeLeft)}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Wrong email?{' '}
              <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700 font-medium">
                Go back
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
