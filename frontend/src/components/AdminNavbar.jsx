import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAdmin } from "../context/AdminContext";

const AdminNavbar = () => {
  const { isAdmin, logoutAdmin } = useContext(AppContext);
  const { isAdmin: isAuthenticatedAdmin, disableAdmin } = useAdmin();
  const navigate = useNavigate();

  if (!isAdmin && !isAuthenticatedAdmin) return null;

  const handleLogout = () => {
    disableAdmin();
    logoutAdmin();
    navigate("/admin");
  };


  const navClass = ({ isActive }) => (
    `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${
      isActive ? "bg-orange-600 text-white" : "text-gray-200 hover:bg-white/10 hover:text-white"
    }`
  );

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950 px-4 py-3 text-white shadow-sm sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <NavLink to="/admin/dashboard" className="shrink-0 text-lg font-black">AJL Admin</NavLink>
          <div className="hidden items-center gap-1 overflow-x-auto lg:flex">
            <NavLink to="/admin/dashboard" className={navClass}>Dashboard</NavLink>
            <NavLink to="/admin/users" className={navClass}>Users</NavLink>
            <NavLink to="/admin/divisions" className={navClass}>Destinations</NavLink>
            <NavLink to="/admin/tour-wizard" className={navClass}>Create Tour</NavLink>
            <NavLink to="/admin/tours" className={navClass}>Tours</NavLink>
            <NavLink to="/admin/hero-banners" className={navClass}>Hero Banners</NavLink>
            <NavLink to="/admin/travel-records" className={navClass}>Records</NavLink>
            <NavLink to="/admin/orders" className={navClass}>Orders</NavLink>
            <NavLink to="/admin/settings" className={navClass}>Settings</NavLink>
          </div>
        </div>
        <button onClick={handleLogout} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-bold text-orange-100 hover:bg-orange-600 hover:text-white">Logout</button>
      </div>
      <div className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
        <NavLink to="/admin/dashboard" className={navClass}>Dashboard</NavLink>
        <NavLink to="/admin/users" className={navClass}>Users</NavLink>
        <NavLink to="/admin/divisions" className={navClass}>Destinations</NavLink>
        <NavLink to="/admin/tour-wizard" className={navClass}>Create</NavLink>
        <NavLink to="/admin/tours" className={navClass}>Tours</NavLink>
        <NavLink to="/admin/hero-banners" className={navClass}>Banners</NavLink>
        <NavLink to="/admin/travel-records" className={navClass}>Records</NavLink>
        <NavLink to="/admin/orders" className={navClass}>Orders</NavLink>
        <NavLink to="/admin/settings" className={navClass}>Settings</NavLink>
      </div>
    </nav>
  );
};

export default AdminNavbar; 
