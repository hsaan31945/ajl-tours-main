import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import PriceWithEdit from "./PriceWithEdit";
import { useAdmin } from "../context/AdminContext";
import { calculateBookingPricing, getGroupDiscountLabel } from "../utils/bookingPricing";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import EditableField from "./EditableField";
import ParticipantStepper from "./ParticipantStepper";
import ApproxPriceNote from "./ApproxPriceNote";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n";

const monthLabel = (date) => date.toLocaleString("default", { month: "long", year: "numeric" });

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getMinimumBookingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getMinimumBookingDateString = () => toLocalDateString(getMinimumBookingDate());

const parseLocalDate = (value) => {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value) => {
  if (!value) return "Select date";
  return parseLocalDate(value).toLocaleDateString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function MonthGrid({ monthDate, selectedDate, minDate, onSelect }) {
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlankCount = (firstDay.getDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: leadingBlankCount }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const minDateValue = parseLocalDate(minDate);
  minDateValue.setHours(0, 0, 0, 0);

  return (
    <div className="min-w-0">
      <h4 className="text-center text-lg font-bold text-gray-900 mb-6">{monthLabel(monthDate)}</h4>
      <div className="grid grid-cols-7 gap-y-3 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-xs font-semibold text-gray-500">{day}</div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="h-10" />;

          const cellDate = new Date(year, month, day);
          const dateString = toLocalDateString(cellDate);
          const isSelected = selectedDate === dateString;
          const isDisabled = cellDate < minDateValue;

          return (
            <button
              key={dateString}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(dateString)}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                isSelected
                  ? "bg-orange-600 text-white shadow-sm"
                  : isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateDropdown({ date, setDate, minDate }) {
  const effectiveMinDate = minDate || getMinimumBookingDateString();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const base = parseLocalDate(date || effectiveMinDate);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const wrapperRef = useRef(null);

  useEffect(() => {
    const min = parseLocalDate(effectiveMinDate);
    min.setHours(0, 0, 0, 0);
    const selected = parseLocalDate(date);
    selected.setHours(0, 0, 0, 0);

    if (!date || selected < min) {
      setDate(effectiveMinDate);
      setVisibleMonth(new Date(min.getFullYear(), min.getMonth(), 1));
    }
  }, [date, effectiveMinDate, setDate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);

  const moveMonth = (amount) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  const handleSelect = (value) => {
    setDate(value);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between rounded-full bg-gray-100 px-4 py-3 text-left transition hover:bg-gray-200 ${
          open ? "ring-2 ring-orange-200" : ""
        }`}
      >
        <span className="flex items-center gap-3 font-semibold text-gray-800">
          <CalendarDays size={20} className="text-gray-600" />
          {formatDisplayDate(date)}
        </span>
        <ChevronDown size={20} className={`text-gray-500 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-[min(720px,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="absolute left-5 top-7 flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="absolute right-5 top-7 flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight size={22} />
          </button>
          <div className="grid gap-8 md:grid-cols-2">
            <MonthGrid
              monthDate={visibleMonth}
              selectedDate={date}
              minDate={effectiveMinDate}
              onSelect={handleSelect}
            />
            <MonthGrid
              monthDate={nextMonth}
              selectedDate={date}
              minDate={effectiveMinDate}
              onSelect={handleSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentSection({
  tourName,
  location,
  bookingSummary,
  price,
  tickets,
  setTickets,
  currency,
  tour,
  date,
  setDate,
  minDate,
  time,
  onPriceUpdated,
  onSavePrice,
  onSaveBookingSummary,
  onSaveMinTickets // callback to save minTickets to database
}) {
  const navigate = useNavigate();
  const { setBooking } = useBooking();
  const { isAdmin, passcodeHeader } = useAdmin();
  const { formatPrice } = useCurrency();
  const { t } = useI18n();
  const [editingMinTickets, setEditingMinTickets] = useState(false);
  const [minTicketsInput, setMinTicketsInput] = useState(tour?.minTicketsPerBooking || 1);
  
  const pricing = calculateBookingPricing({ tour, tickets, selectedDate: date, fallbackPrice: price });
  const minTickets = pricing.minTickets;
  const currentTickets = pricing.tickets;
  const ticketsMeetMinimum = pricing.validTickets;
  useEffect(() => {
    if (Number(tickets) < minTickets) {
      setTickets(minTickets);
    }
  }, [minTickets, setTickets, tickets]);
  
  // Enforce minimum tickets
  const handleTicketsChange = (value) => {
    const numValue = Number(value);
    if (Number.isInteger(numValue) && numValue > 0) {
      setTickets(Math.max(numValue, minTickets));
    }
  };
  
  // Save minimum tickets to database (admin only)
  const saveMinTickets = async () => {
    if (!isAdmin || !onSaveMinTickets) return;
    const success = await onSaveMinTickets(minTicketsInput);
    if (success) {
      setEditingMinTickets(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border-t-4 border-orange-600 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-center">{tourName}</h2>
      <p className="text-gray-600 mb-2 text-center">{location}</p>
      {(isAdmin || bookingSummary) && (
        <EditableField
          tag="span"
          value={bookingSummary || ""}
          placeholder="Add a short booking card summary"
          multiline={true}
          maxLength={400}
          showEditIcon={isAdmin}
          onSave={(value) => onSaveBookingSummary ? onSaveBookingSummary(value.slice(0, 400)) : false}
          className="block text-gray-700 mb-4 text-center leading-relaxed"
        />
      )}
      <div className="flex flex-col gap-2 w-full mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{t("booking.perPerson")}:</span>
          <div className="font-bold text-orange-600 text-right">
            {pricing.hasDiscount && (
              <div className="text-sm font-semibold text-gray-400 line-through">
                {isAdmin ? `${currency || "CHF"}${pricing.originalBaseUnitPrice.toFixed(2)}` : formatPrice(pricing.originalBaseUnitPrice)}
              </div>
            )}
            {isAdmin ? (
              <PriceWithEdit
                price={Number(pricing.originalBaseUnitPrice)}
                currencySymbol={currency || "CHF"}
                tourId={tour?.id}
                isAdmin={isAdmin}
                onSavePrice={onSavePrice}
                onUpdated={onPriceUpdated}
              />
            ) : (
              <span>{formatPrice(pricing.baseUnitPrice)}</span>
            )}
          </div>
        </div>
        <ApproxPriceNote className="text-right" />
        {pricing.hasGroupDiscount && (
          <div className="flex justify-between items-center rounded-lg bg-green-50 px-3 py-2 text-sm">
            <span className="font-semibold text-green-700">
              {getGroupDiscountLabel(pricing)}
            </span>
            <span className="font-bold text-green-700">
              -{formatPrice(pricing.groupDiscountTotal)}
            </span>
          </div>
        )}
        
        {/* Admin-only: Minimum Tickets Setting */}
        {isAdmin && (
          <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <span className="font-semibold text-yellow-700 text-sm">Min Tickets (Admin):</span>
            {editingMinTickets ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={minTicketsInput}
                  onChange={e => setMinTicketsInput(Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-center text-sm"
                />
                <button
                  onClick={saveMinTickets}
                  className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingMinTickets(false);
                    setMinTicketsInput(minTickets);
                  }}
                  className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-yellow-700">{minTickets}</span>
                <button
                  onClick={() => setEditingMinTickets(true)}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  title="Edit minimum tickets"
                >
                  ✏️
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between rounded-full bg-gray-100 px-4 py-3">
          <span className="flex items-center gap-3 font-semibold text-gray-800">
            <Users size={20} className="text-gray-600" />
            {t("common.adult")} x
          </span>
          <ParticipantStepper
            value={currentTickets}
            min={minTickets}
            onChange={handleTicketsChange}
          />
        </div>
        {setDate && (
          <DateDropdown
            date={date}
            setDate={setDate}
            minDate={minDate || getMinimumBookingDateString()}
          />
        )}
        {minTickets > 1 && (
          <p className="text-xs text-gray-500 text-right">{t("booking.minimumAdults", { count: minTickets })}</p>
        )}
        {!ticketsMeetMinimum && (
          <p className="text-xs text-red-600 text-right font-semibold">
            {t("booking.increaseAdults")}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={!ticketsMeetMinimum}
        className={`w-full font-bold py-3 rounded-xl mt-4 transition ${
          ticketsMeetMinimum
            ? "bg-orange-600 hover:bg-orange-700 text-white"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
        onClick={() => {
          if (!ticketsMeetMinimum) return;
          setBooking({ tour, tickets: currentTickets, date, time });
          navigate("/booking-options");
        }}
      >
        {t("common.reserveYourSpot")}
      </button>
    </div>
  );
}

export default PaymentSection; 
