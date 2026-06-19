import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Lock } from "lucide-react";
import { useBooking } from "../context/BookingContext";
import { apiUrl } from "../utils/api";
import { getTourId } from "../utils/tourId";
import { calculateBookingPricing } from "../utils/bookingPricing";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE } from "../utils/countryCodes";
import { cleanDisplayName } from "../utils/textFormatting";
import OrderSummaryBreakdown from "../components/OrderSummaryBreakdown";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";
import { formatFreeCancellationCutoff } from "../utils/bookingDates";
import CheckoutProgress from "../components/CheckoutProgress";

const UserDetails = () => {
  const navigate = useNavigate();
  const { booking, updateContact, updateTour } = useBooking();
  const { formatPrice } = useCurrency();
  const { language, t } = useI18n();
  const { tour: bookingTour, tickets = 1, date, time, contact, flexibility } = booking || {};
  const [freshTour, setFreshTour] = useState(null);
  const tour = freshTour || bookingTour;
  const pricing = calculateBookingPricing({ tour, tickets, selectedDate: date, flexibility });
  const minTickets = pricing.minTickets;
  const currentTickets = pricing.tickets;
  const ticketsMeetMinimum = pricing.validTickets;
  const tourName = cleanDisplayName(tour?.title || tour?.name || "Tour");
  const [fullName, setFullName] = useState(contact?.fullName || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [country, setCountry] = useState(contact?.country || DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState(contact?.phone || "");
  const [pickupAddress, setPickupAddress] = useState(contact?.pickupAddress || contact?.address || "");
  const bookingTourId = getTourId(bookingTour);
  const cancellationCutoff = formatFreeCancellationCutoff(date, time, language);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingTourId) return;

    let cancelled = false;
    const refreshTour = async () => {
      try {
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
        }
      } catch (error) {
        console.error('Failed to refresh MongoDB tour for user details:', error);
      }
    };

    refreshTour();
    return () => {
      cancelled = true;
    };
  }, [bookingTourId, updateTour]);

  useEffect(() => {
    updateContact({ fullName, email, country, phone, pickupAddress });
  }, [fullName, email, country, phone, pickupAddress, updateContact]);

  // Validation functions
  const validateForm = () => {
    console.log("Validating form with:", { fullName, email, phone, pickupAddress }); // Debug log
    
    const newErrors = {};
    
    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = t("auth.fullName") + " " + t("booking.isRequired");
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t("booking.fullNameMin");
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = t("auth.email") + " " + t("booking.isRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("booking.emailAlert");
    }
    
    // Phone validation
    if (!phone.trim()) {
      newErrors.phone = t("auth.phoneNumber") + " " + t("booking.isRequired");
    } else if (!/^[+]?[0-9\s\-()]{8,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!pickupAddress.trim()) {
      newErrors.pickupAddress = t("booking.pickupAddressRequired");
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
    console.log("Current form values:", { fullName, email, phone, pickupAddress }); // Debug log
    
    // Double-check validation
    const isValid = validateForm();
    console.log("Form validation result:", isValid); // Debug log
    
    if (!ticketsMeetMinimum) {
      alert(t("booking.minimumTicketsAlert", { count: minTickets }));
      navigate("/booking-options");
      return false;
    }

    if (isValid) {
      setIsSubmitting(true);
      console.log("Form is valid, navigating to payment"); // Debug log
      
      // Save tour data to localStorage for PaymentSuccess page
      const tourDataForPayment = {
        tourName,
        tourPrice: pricing.baseUnitPrice,
        saleUnitPrice: pricing.saleUnitPrice,
        amount: pricing.total,
        groupDiscountTier: pricing.groupDiscountTier,
        groupDiscountUnitAmount: pricing.groupDiscountUnitAmount,
        groupDiscountTotal: pricing.groupDiscountTotal,
        groupDiscountPercent: pricing.groupDiscountPercent,
        hasGroupDiscount: pricing.hasGroupDiscount,
        tickets: currentTickets,
        tourId: getTourId(tour) || "unknown",
        currency: pricing.currency,
        groupDiscountEnabled: tour.groupDiscountEnabled === true,
        groupDiscount4: tour.groupDiscount4 ?? null,
        groupDiscount5: tour.groupDiscount5 ?? null,
        groupDiscount6Plus: tour.groupDiscount6Plus ?? null,
        date: date || new Date().toLocaleDateString(),
        time: time || "09:00",
        flexibility: flexibility || "standard", // Include flexibility selection
        userName: fullName.trim(),
        userEmail: email.trim(),
        userPhone: phone.trim(),
        pickupAddress: pickupAddress.trim(),
        address: pickupAddress.trim(),
        country,
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
      alert(t("booking.formInvalidAlert"));
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

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      {/* Step Progress Bar */}
      <CheckoutProgress currentStep={2} />

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto">
        {/* Left: Personal Details Form */}
        <div className="flex-1 bg-white rounded-xl shadow p-6 mb-8 md:mb-0">
          <div className="mb-4 text-lg font-bold">{t("booking.personalDetails")}</div>
          <div className="mb-2 text-green-700 flex items-center gap-2"><Lock className="w-5 h-5" aria-hidden="true" /> {t("booking.secureCheckout")}</div>
          <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold mb-1">{t("auth.fullName")}*</label>
              <input 
                type="text" 
                id="fullName"
                name="fullName"
                className={`w-full border rounded px-3 py-2 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required
                placeholder={t("auth.enterName")}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t("auth.email")}*</label>
              <input 
                type="email" 
                id="email"
                name="email"
                className={`w-full border rounded px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder={t("auth.enterEmail")}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t("booking.country")}*</label>
              <select 
                id="country"
                name="country"
                className="w-full border rounded px-3 py-2" 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                required
              >
                <option value="">Select your country</option>
                {COUNTRY_CODES.map((countryOption) => (
                  <option key={countryOption.value} value={countryOption.value}>
                    {countryOption.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t("auth.phoneNumber")}*</label>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                className={`w-full border rounded px-3 py-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                required
                placeholder={t("auth.enterPhone")}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t("booking.pickupAddress")}*</label>
              <input
                type="text"
                id="pickupAddress"
                name="pickupAddress"
                className={`w-full border rounded px-3 py-2 ${errors.pickupAddress ? 'border-red-500' : 'border-gray-300'}`}
                value={pickupAddress}
                onChange={e => setPickupAddress(e.target.value)}
                required
                placeholder={t("booking.pickupPlaceholder")}
              />
              {errors.pickupAddress && <p className="text-red-500 text-sm mt-1">{errors.pickupAddress}</p>}
            </div>
            <div className="text-xs text-gray-500 mt-1">We'll only contact you with essential updates or changes to your booking</div>
            <button
              type="submit"
              className={`w-full font-bold py-3 rounded-xl mt-4 transition ${
                isSubmitting || !fullName.trim() || !email.trim() || !phone.trim() || !pickupAddress.trim()
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={isSubmitting || !fullName.trim() || !email.trim() || !phone.trim() || !pickupAddress.trim()}
            >
              {isSubmitting ? t("booking.validating") : t("booking.goToPayment")}
            </button>
          </form>
          {cancellationCutoff && (
            <div className="mt-6 text-green-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
              {t("common.freeCancellation")}
              <span className="text-gray-700">
                {t("booking.freeCancellationUntil", { cutoff: cancellationCutoff })}
              </span>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="w-full md:w-[400px] bg-white rounded-xl shadow p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-4">
            {tour?.images && tour.images[0] && (
              <img src={tour.images[0]} alt={tourName} className="w-16 h-16 object-cover rounded" />
            )}
            <div>
              <div className="font-bold text-lg">{tourName}</div>
            </div>
          </div>
          <div className="border-b pb-2 mb-2">
            <div className="text-sm">{t("booking.languageEnglish")}</div>
            <div className="text-sm">{date || t("common.dateNotSelected")}</div>
            <div className="text-sm">{currentTickets} {currentTickets > 1 ? t("common.adults") : t("common.adult")}</div>
            {!ticketsMeetMinimum && (
              <div className="text-sm text-red-600 font-semibold">{t("booking.minimumAdults", { count: minTickets })}</div>
            )}
            {/* Removed Change date or participants button */}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-green-700">{t("common.freeCancellation")}</span>
            <span className="text-green-700">{t("common.greatValue")}</span>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <input type="text" placeholder="Enter promo, credit, or gift code" className="border rounded px-3 py-2 text-sm" />
          </div>
          <OrderSummaryBreakdown pricing={pricing} travelers={currentTickets} />
          <div className="flex justify-between items-center mt-4 font-bold text-lg">
            <span>{t("common.total")}</span>
            <span>{formatPrice(pricing.total)}</span>
          </div>
          <div className="text-xs text-gray-500 text-right">{t("common.allTaxesIncluded")}</div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails; 
