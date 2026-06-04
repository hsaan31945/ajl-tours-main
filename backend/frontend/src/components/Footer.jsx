import React from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="bg-white border-t-2 border-red-500 shadow-inner mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <img src="/logoTravel.png" width={120} height={34} alt="AJL Tours logo" className="mb-4" />
          <p className="text-gray-600 text-sm">AJL Tours is your trusted partner for unforgettable travel experiences. Explore the world with us!</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-black">Quick Links</h3>
          <ul className="text-gray-600 text-sm space-y-1">
            <li><Link to="/" className="hover:text-red-600">Home</Link></li>
            <li><Link to="/about" className="hover:text-red-600">About</Link></li>
            <li><Link to="/blogs" className="hover:text-red-600">Blogs</Link></li>
            <li><Link to="/switzerland" className="hover:text-red-600">Switzerland Tours</Link></li>
            <li><Link to="/sirilanka" className="hover:text-red-600">Sirilanka Tours</Link></li>
            <li><Link to="/contact" className="hover:text-red-600">Contact Us</Link></li>
            <li><Link to="/flexibility" className="hover:text-red-600">Flexibility Policy</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-black">Contact Info</h3>
          <ul className="text-gray-600 text-sm space-y-1">
            <li>Email: contact@ajltransfer.com</li>
            <li>Phone: +41 78 207 89 02</li>
            <li>Address: Plattenstrasse 7, 8152 Opfikon, Switzerland</li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-black">Follow Us</h3>
          <div className="flex gap-3 mt-2">
            <a
              href="https://www.instagram.com/ajltransfer?igsh=MXdheGhmcTc3MGxkZA=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="AJL Transfer on Instagram"
            >
              <img src={assets.instagram_icon} alt="Instagram" width={32} height={32} loading="lazy" decoding="async" className="hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
      <div className="text-center text-gray-500 text-xs py-4 border-t border-gray-200">
        &copy; 2026 AJL Tours. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;
