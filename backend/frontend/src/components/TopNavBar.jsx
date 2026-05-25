import React from "react";
import { Link } from "react-router-dom";

const TopNavBar = () => (
  <nav className="w-full sticky top-0 z-50 bg-white/70 backdrop-blur border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <img src="/logoTravel.png" alt="AJL Tours logo" className="h-10 w-auto" />
        <span className="font-extrabold text-xl text-black tracking-wide">AJL Tours</span>
      </div>
      <ul className="flex gap-6 items-center text-black font-medium">
        <li><Link to="/" className="hover:text-red-600">Home</Link></li>
        <li><Link to="/consultants" className="hover:text-red-600">Consultants</Link></li>
        <li><Link to="/blog" className="hover:text-red-600">Blog</Link></li>
        <li><Link to="/testimonials" className="hover:text-red-600">Testimonials</Link></li>
        <li><Link to="/careers" className="hover:text-red-600">Careers</Link></li>
        <li><Link to="/login" className="hover:text-red-600">Sign In</Link></li>
      </ul>
    </div>
  </nav>
);

export default TopNavBar; 