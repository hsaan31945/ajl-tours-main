import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL = "https://wa.me/41782078902";

function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with AJL Tours on WhatsApp"
      className="fixed bottom-3 right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14 md:bottom-8 md:right-8 md:h-16 md:w-16"
    >
      <FaWhatsapp className="h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9" aria-hidden="true" />
    </a>
  );
}

export default FloatingWhatsApp;
