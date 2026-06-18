import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import { apiUrl } from "../utils/api";
import { getTourId } from "../utils/tourId";
import { calculateBookingPricing, parseTicketCount } from "../utils/bookingPricing";
import { cleanDisplayName } from "../utils/textFormatting";
import ParticipantStepper from "../components/ParticipantStepper";
import OrderSummaryBreakdown from "../components/OrderSummaryBreakdown";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";
import SEO from "../components/SEO";

const Flexibility = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { booking, updateFlexibility, updateTickets, updateTour, updateDateTime } = useBooking();
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  
  // Use tour data from location state if available, otherwise from booking context
  const tourData = location.state?.tour || location.state?.tourData || booking?.tour;
  const [freshTour, setFreshTour] = useState(null);
  
  // Handle different tour data structures
  let tour = freshTour || tourData;
  if (!freshTour && location.state && location.state.tour) {
    // If tour is in location.state, use it
    tour = location.state.tour;
  } else if (!freshTour && booking && booking.tour) {
    // Fallback to booking context
    tour = booking.tour;
  }

  const sourceTourId = getTourId(tourData || booking?.tour);

  useEffect(() => {
    if (!sourceTourId) return;

    let cancelled = false;
    const refreshTour = async () => {
      try {
        const response = await fetch(apiUrl(`/api/tours/${sourceTourId}`), {
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
        console.error('Failed to refresh MongoDB tour for flexibility:', error);
      }
    };

    refreshTour();
    return () => {
      cancelled = true;
    };
  }, [sourceTourId, updateTour]);

  // Save tour data to BookingContext if it exists and isn't already saved
  useEffect(() => {
    if (tour && (!booking?.tour || booking.tour.id !== tour.id)) {
      updateTour(tour);
    }
  }, [tour, booking?.tour, updateTour]);
  
  const { tickets = 1, date, time } = booking || {};
  
  // Debug logging
  console.log("Location state:", location.state);
  console.log("Tour data:", tourData);
  console.log("Final tour object:", tour);
  
  const [localTickets, setLocalTickets] = useState(location.state?.participants || tickets);
  const pricing = calculateBookingPricing({ tour, tickets: localTickets, selectedDate: date, flexibility: "standard" });
  const minTickets = pricing.minTickets;
  const localTicketCount = pricing.tickets;
  const ticketsMeetMinimum = pricing.validTickets;
  const pricePerTicket = pricing.baseUnitPrice;
  const totalPrice = pricing.total;
  const tourName = cleanDisplayName(tour?.title || tour?.name || "Tour");

  useEffect(() => {
    updateFlexibility("standard");
  }, [updateFlexibility]);

  useEffect(() => {
    if (Number(localTickets) < minTickets) {
      setLocalTickets(minTickets);
      updateTickets(minTickets);
    }
  }, [localTickets, minTickets, updateTickets]);

  // Ensure tickets reflect what was set on VisitCheckout2 via localStorage
  useEffect(() => {
    try {
      const rawCurrent = localStorage.getItem('currentTourData');
      const rawRecent = localStorage.getItem('recentTourData');
      const data = rawCurrent ? JSON.parse(rawCurrent) : (rawRecent ? JSON.parse(rawRecent) : null);
      if (data) {
        if (data.selectedDate || data.date) {
          const dateVal = data.selectedDate || data.date;
          const timeVal = data.time || '09:00';
          updateDateTime(dateVal, timeVal);
        }
      } else if (Number.isFinite(location.state?.participants) && location.state.participants > 0) {
        setLocalTickets(Number(location.state.participants));
        updateTickets(Number(location.state.participants));
      }
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!tour) {
    return (
      <div className="text-center mt-20 text-xl text-red-600">
        <div>{t("booking.noTour")}</div>
        <div className="text-sm mt-2 text-gray-500">
          {t("booking.debugLocation", {
            state: location.state ? t("booking.data") : t("booking.noData"),
            tour: tourData ? t("booking.exists") : t("booking.missing"),
          })}
        </div>
      </div>
    );
  }

  const steps = [t("booking.flexibility"), t("booking.userDetails"), t("booking.payment")];
  const currentStep = 1;

  const handleTicketsChange = (val) => {
    const nextTickets = parseTicketCount(val);
    if (!nextTickets) return;
    const clampedTickets = Math.max(nextTickets, minTickets);
    setLocalTickets(clampedTickets);
    updateTickets(clampedTickets);
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-2 flex flex-col items-center">
      <SEO
        title="Booking Options | AJL Tours"
        description="Choose participants and booking options for your selected AJL Tours experience."
        canonicalPath="/booking-options"
        noIndex
      />
      {/* Step Progress Bar */}
      <div className="flex justify-center items-center gap-6 mb-8 w-full max-w-3xl mx-auto">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (idx === 0) navigate("/booking-options");
            if (idx === 1 && ticketsMeetMinimum) navigate("/userDetails");
            if (idx === 2 && ticketsMeetMinimum) navigate("/payment");
          }}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base border-2 ${idx + 1 === currentStep ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-700'}`}>{idx + 1}</div>
            <span className={`font-semibold text-sm sm:text-base ${idx + 1 === currentStep ? 'text-blue-700' : 'text-gray-500'}`}>{step}</span>
            {idx < steps.length - 1 && <div className="w-6 sm:w-8 h-0.5 bg-blue-200 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl mx-auto">
        {/* Left: Flexibility Options */}
        <div className="flex-1 bg-white rounded-xl shadow p-6 mb-8 md:mb-0">
          <div className="mb-4 flex items-center gap-4">
            {tour?.images && tour.images[0] && (
              <img src={tour.images[0]} alt={tourName} className="w-16 h-16 object-cover rounded" />
            )}
            <div>
              <div className="font-bold text-lg">{tourName}</div>
            </div>
          </div>
          <div className="mb-6">
            <div className="block mb-4 border rounded-xl p-4 flex flex-col gap-2 transition-all duration-200 border-blue-500 bg-blue-50">
              <div className="flex items-center gap-2">
                <span className="font-bold">{t("booking.standardTicket")}</span>
              </div>
              <ul className="text-green-700 ml-6 list-disc space-y-1 text-sm">
                <li>{t("booking.cancel24", { amount: formatPrice(pricePerTicket) })}</li>
                <li>{t("booking.cancelAnyReason")}</li>
              </ul>
              <div className="text-right font-bold text-lg mt-2">{formatPrice(pricePerTicket)}</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 mb-2">
            <span className="font-semibold">{t("booking.adultsLabel")}</span>
            <ParticipantStepper
              value={localTicketCount}
              min={minTickets}
              onChange={handleTicketsChange}
            />
          </div>
          {minTickets > 1 && (
            <p className="text-xs text-gray-500 text-right">{t("booking.minimumAdults", { count: minTickets })}</p>
          )}
          {!ticketsMeetMinimum && (
            <p className="text-xs text-red-600 text-right font-semibold">{t("booking.increaseAdults")}</p>
          )}
          <div className="flex justify-between items-center mt-2 font-bold text-lg">
            <span>{t("common.total")}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <button
            disabled={!ticketsMeetMinimum}
            className={`w-full font-bold py-3 rounded-xl mt-4 transition ${
              ticketsMeetMinimum
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            onClick={() => {
              if (tour && ticketsMeetMinimum) {
                // Ensure tour data is saved before navigation
                updateTour(tour);
                updateFlexibility("standard");
                updateTickets(localTicketCount);
                navigate("/userDetails");
              }
            }}
          >
            {t("common.continue")}
          </button>
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
            <div className="text-sm">{tour.address || tour.location || ""}</div>
            <div className="text-sm">{date || t("common.dateNotSelected")} • {time || t("common.timeNotSelected")}</div>
            <div className="text-sm">{localTicketCount} {localTicketCount > 1 ? t("common.adults") : t("common.adult")}</div>
            <button className="text-blue-600 underline text-xs mt-1">{t("booking.changeDateParticipants")}</button>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-green-700">{t("common.freeCancellation")}</span>
            <span className="text-green-700">{t("common.greatValue")}</span>
          </div>
          <OrderSummaryBreakdown pricing={pricing} travelers={localTicketCount} />
          <div className="flex justify-between items-center mt-4 font-bold text-lg">
            <span>{t("common.total")}</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <div className="text-xs text-gray-500 text-right">{t("common.allTaxesIncluded")}</div>
        </div>
      </div>
    </div>
  );
};

export default Flexibility; 
