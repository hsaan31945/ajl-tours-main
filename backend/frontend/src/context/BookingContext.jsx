import React, { createContext, useContext, useState } from "react";

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
      country: "Pakistan (+92)",
      phone: ""
    }
  });

  // Helper functions to update each part
  const updateFlexibility = (flex) => setBooking(prev => ({ ...prev, flexibility: flex }));
  const updateContact = (contact) => setBooking(prev => ({ ...prev, contact: { ...prev.contact, ...contact } }));
  const updateTickets = (tickets) => setBooking(prev => ({ ...prev, tickets }));
  const updateDateTime = (date, time) => setBooking(prev => ({ ...prev, date, time }));
  const updateTour = (tour) => setBooking(prev => ({ ...prev, tour }));

  return (
    <BookingContext.Provider value={{ booking, setBooking, updateFlexibility, updateContact, updateTickets, updateDateTime, updateTour }}>
      {children}
    </BookingContext.Provider>
  );
} 