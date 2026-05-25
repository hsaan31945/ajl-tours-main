import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import axios from "axios";

const AdminLogin = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('jwt'); // 'jwt' or 'passcode'
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, enableWithPasscode } = useAdmin();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setShowLogin(true);
        setError("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleJWTLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(password);
      if (result.success) {
        setShowLogin(false);
        navigate("/admin/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    console.log('Passcode submit triggered', passcode);
    
    const result = enableWithPasscode(passcode);
    console.log('enableWithPasscode result:', result);
    
    if (result) {
      console.log('Passcode valid, navigating to dashboard');
      setError("");
      setShowLogin(false);
      navigate("/admin/dashboard");
    } else {
      console.log('Invalid passcode');
      setError("Invalid passcode");
    }
  };

  const handleCancel = () => {
    setShowLogin(false);
    setPassword("");
    setPasscode("");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl mb-8 text-center">Admin Portal</h1>
      
      <div className="bg-white/20 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        
        {showLogin && (
          <div className="mt-6">
            {/* Login Mode Toggle */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => { setLoginMode('jwt'); setError(''); }}
                className={`flex-1 py-2 rounded ${loginMode === 'jwt' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              >
                Email/Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('passcode'); setError(''); }}
                className={`flex-1 py-2 rounded ${loginMode === 'passcode' ? 'bg-blue-500 text-white' : 'text-gray-700'}`}
              >
                Passcode
              </button>
            </div>

            {/* JWT Login Form - Password Only */}
            {loginMode === 'jwt' && (
              <form onSubmit={handleJWTLogin} className="space-y-4">
                <div>
                  <label className="block text-md font-medium mb-2 text-left">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter admin password"
                    required
                    autoFocus
                  />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <div className="flex space-x-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 text-lg py-3 px-6 bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:border-white hover:text-white font-bold rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="flex-1 text-lg py-3 px-6 bg-transparent border-2 border-gray-500 text-gray-500 hover:bg-gray-500 hover:border-white hover:text-white font-bold rounded-lg shadow-md transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Passcode Login Form (Legacy) */}
            {loginMode === 'passcode' && (
              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-md font-medium mb-2">Enter Admin Passcode</label>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    placeholder="Enter passcode"
                    autoFocus
                  />
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <div className="flex space-x-3">
                  <button 
                    type="submit" 
                    className="flex-1 text-lg py-3 px-6 bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:border-white hover:text-white font-bold rounded-lg shadow-md transition-all duration-300"
                  >
                    Access Dashboard
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancel}
                    className="flex-1 text-lg py-3 px-6 bg-transparent border-2 border-gray-500 text-gray-500 hover:bg-gray-500 hover:border-white hover:text-white font-bold rounded-lg shadow-md transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin; 
