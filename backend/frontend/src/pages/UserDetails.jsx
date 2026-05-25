import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";

const UserDetails = () => {
  const navigate = useNavigate();
  const { booking, updateContact } = useBooking();
  const { tour, tickets = 1, date, time, contact, flexibility } = booking || {};
  const [fullName, setFullName] = useState(contact?.fullName || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [country, setCountry] = useState(contact?.country || "Pakistan (+92)");
  const [phone, setPhone] = useState(contact?.phone || "");
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    updateContact({ fullName, email, country, phone });
  }, [fullName, email, country, phone]);

  // Validation functions
  const validateForm = () => {
    console.log("Validating form with:", { fullName, email, phone }); // Debug log
    
    const newErrors = {};
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\+]?[0-9\s\-\(\)]{8,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    console.log("Validation errors:", newErrors); // Debug log
    setErrors(newErrors);
    
    const isValid = Object.keys(newErrors).length === 0;
    console.log("Form is valid:", isValid); // Debug log
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form from submitting
    e.stopPropagation(); // Stop event bubbling
    
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Submit button clicked"); // Debug log
    console.log("Current form values:", { fullName, email, phone }); // Debug log
    
    // Double-check validation
    const isValid = validateForm();
    console.log("Form validation result:", isValid); // Debug log
    
    if (isValid) {
      setIsSubmitting(true);
      console.log("Form is valid, navigating to payment"); // Debug log
      
      // Save tour data to localStorage for PaymentSuccess page
      const tourDataForPayment = {
        tourName: tour?.title || tour?.name || "Tour",
        tourPrice: tour?.price || 0, // Base price per ticket
        amount: tour?.price || 0, // Keep for backward compatibility
        tickets: tickets || 1,
        tourId: tour?.id || "unknown",
        currency: tour?.currency || "$",
        date: date || new Date().toLocaleDateString(),
        time: time || "09:00",
        flexibility: flexibility || "standard" // Include flexibility selection
      };
      
      localStorage.setItem('recentTourData', JSON.stringify(tourDataForPayment));
      console.log('Tour data saved for payment:', tourDataForPayment);
      
      // Navigate to payment only if validation passes
      setTimeout(() => {
        navigate("/payment");
      }, 100);
    } else {
      console.log("Form is invalid, not navigating"); // Debug log
      console.log("Current errors:", errors); // Debug log
      alert("Please fill in all required fields correctly before proceeding.");
      return false; // Explicitly return false
    }
    
    return false; // Explicitly return false
  };

  if (!tour) {
    return (
      <div className="text-center mt-20 text-xl text-red-600">
        <div>No tour selected for contact. Please go back and try again.</div>
        <div className="text-sm mt-4 text-gray-600">
          <button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const steps = ["Flexibility", "User Details", "Payment"];
  const currentStep = 2;

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      {/* Step Progress Bar */}
      <div className="flex justify-center items-center gap-6 mb-8 w-full max-w-3xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (idx === 0) navigate("/flexibility");
            if (idx === 1 && flexibility) navigate("/userDetails");
            if (idx === 2 && flexibility) navigate("/payment");
          }}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 ${idx + 1 === currentStep ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-700'}`}>{idx + 1}</div>
            <span className={`font-semibold text-sm sm:text-base ${idx + 1 === currentStep ? 'text-blue-700' : 'text-gray-500'}`}>{step}</span>
            {idx < steps.length - 1 && <div className="w-6 sm:w-8 h-0.5 bg-blue-200 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto">
        {/* Left: Personal Details Form */}
        <div className="flex-1 bg-white rounded-xl shadow p-6 mb-8 md:mb-0">
          <div className="mb-4 text-lg font-bold">Enter your personal details</div>
          <div className="mb-2 text-green-700 flex items-center gap-2"><span className="material-icons text-green-700">lock</span> Checkout is fast and secure</div>
          <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold mb-1">Full name*</label>
              <input 
                type="text" 
                id="fullName"
                name="fullName"
                className={`w-full border rounded px-3 py-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email*</label>
              <input 
                type="email" 
                id="email"
                name="email"
                className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Country*</label>
              <select 
                id="country"
                name="country"
                className="w-full border rounded px-3 py-2" 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                required
              >
                <option value="">Select your country</option>
                <option value="Pakistan (+92)">Pakistan (+92)</option>
                <option value="India (+91)">India (+91)</option>
                <option value="USA (+1)">USA (+1)</option>
                <option value="UK (+44)">UK (+44)</option>
                {/* Add more countries as needed */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Mobile phone number*</label>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                className={`w-full border rounded px-3 py-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required
                placeholder="Enter your phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div className="text-xs text-gray-500 mt-1">We'll only contact you with essential updates or changes to your booking</div>
            <button
              type="submit"
              className={`w-full font-bold py-3 rounded-xl mt-4 transition ${
                isSubmitting || !fullName.trim() || !email.trim() || !phone.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isSubmitting || !fullName.trim() || !email.trim() || !phone.trim()}
            >
              {isSubmitting ? "Validating..." : "Go to payment"}
            </button>
          </form>
          <div className="mt-6 text-green-700 flex items-center gap-2"><span className="material-icons text-green-700">check_circle</span> Free cancellation <span className="text-gray-700">Until 10:00 AM on August 11</span></div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full md:w-[400px] bg-white rounded-xl shadow p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-4">
            {tour?.images && tour.images[0] && (
              <img src={tour.images[0]} alt={tour.title || tour.name} className="w-16 h-16 object-cover rounded" />
            )}
            <div>
              <div className="font-bold text-lg">{tour.title || tour.name}</div>
              <div className="text-yellow-600 text-sm">★ 4.9 (3,396)</div>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-1 inline-block">Top rated</div>
            </div>
          </div>
          <div className="border-b pb-2 mb-2">
            <div className="text-sm">Language: English</div>
            <div className="text-sm">{date || "Date not selected"}</div>
            <div className="text-sm">{tickets} adult{tickets > 1 ? "s" : ""} (Age 13 - 99)</div>
            {/* Removed Change date or participants button */}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-green-700">Free cancellation</span>
            <span className="text-green-700">Great value</span>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <input type="text" placeholder="Enter promo, credit, or gift code" className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-between items-center mt-4 font-bold text-lg">
            <span>Total</span>
            <span>{tour.currency || "$"}{(() => {
              const pricePerTicket = tour?.price || 0;
              const upgradePrice = Math.round(pricePerTicket * 1.225 * 100) / 100;
              const basePrice = flexibility === "upgrade" ? upgradePrice : pricePerTicket;
              return (basePrice * tickets).toFixed(2);
            })()}</span>
          </div>
          <div className="text-xs text-gray-500 text-right">All taxes and fees included</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 