import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_COUNTRY_CODE } from "../utils/countryCodes";

const BookingContext = createContext();

export function useBooking() {
  return useContext(BookingContext);
}

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState({
    tour: null,
    tickets: 1,
    date: null,
    time: null,
    flexibility: "standard", // 'standard' or 'upgrade'
    contact: {
      fullName: "",
      email: "",
      country: DEFAULT_COUNTRY_CODE,
      phone: ""
    }
  });

  const updateFlexibility = useCallback((flex) => {
    setBooking(prev => ({ ...prev, flexibility: flex }));
  }, []);

  const updateContact = useCallback((contact) => {
    setBooking(prev => ({ ...prev, contact: { ...prev.contact, ...contact } }));
  }, []);

  const updateTickets = useCallback((tickets) => {
    const number = Number(tickets);
    if (!Number.isInteger(number) || number < 1) return;
    setBooking(prev => ({ ...prev, tickets: number }));
  }, []);

  const updateDateTime = useCallback((date, time) => {
    setBooking(prev => ({ ...prev, date, time }));
  }, []);

  const updateTour = useCallback((tour) => {
    setBooking(prev => {
      const currentId = prev.tour?._id || prev.tour?.id || prev.tour?.staticId;
      const nextId = tour?._id || tour?.id || tour?.staticId;
      if (currentId && nextId && currentId === nextId) {
        return prev;
      }
      return { ...prev, tour };
    });
  }, []);

  const value = useMemo(() => ({
    booking,
    setBooking,
    updateFlexibility,
    updateContact,
    updateTickets,
    updateDateTime,
    updateTour,
  }), [booking, updateFlexibility, updateContact, updateTickets, updateDateTime, updateTour]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
} 
