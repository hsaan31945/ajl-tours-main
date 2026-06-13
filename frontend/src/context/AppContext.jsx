import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../utils/api";
// socket.io disabled

export const AppContext = createContext();

const SOCKET_URL = '';

const getCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const AppContextProvider = (props) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]); // Array of user objects
  const [bookings, setBookings] = useState([]); // Array of booking objects
  const [user, setUser] = useState(null); // Current logged-in user
  const [isAdmin, setIsAdmin] = useState(false);
  const [trips, setTrips] = useState([]); // Array of trip objects
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminPassword, setAdminPassword] = useState("admin@@1212");
  const [loading, setLoading] = useState(true);

  const loadAdminBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const passcode = localStorage.getItem('adminPasscode') || import.meta.env.VITE_ADMIN_PASSCODE || '';
      const bookingsRes = await axios.get(apiUrl('/api/admin/bookings'), {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : (passcode ? { 'X-Admin-Passcode': passcode } : {}),
      });
      setBookings(getCollection(bookingsRes.data));
    } catch (e) {
      console.error('Failed to load bookings:', e?.response?.data || e.message);
      setBookings([]);
    }
  };

  // Fetch admin-only booking data without touching public page startup.
  useEffect(() => {
    if (localStorage.getItem("isAdmin") === "true") {
      loadAdminBookings();
    }
  }, []);

  // Register a new user
  const addUser = async (newUser) => {
    const res = await axios.post(apiUrl('/api/users'), newUser);
    setUsers((prev) => [...prev, res.data]);
    setUser(res.data);
  };

  // Login user
  const loginUser = async (email, password) => {
    try {
      const response = await axios.post(apiUrl('/api/users/login'), { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  // Add a booking
  const addBooking = async (booking) => {
    const res = await axios.post(apiUrl('/api/bookings'), booking);
    if (res.data.success) {
      setBookings((prev) => [...prev, res.data.data]);
    } else if (res.data) {
      setBookings((prev) => [...prev, res.data]);
    }
  };

  // Get all bookings for current user
  const getBookings = () => {
    if (!user) return [];
    return bookings.filter((b) => b.email === user.email);
  };

  // Initialize isAdmin from localStorage
  useEffect(() => {
    const adminFlag = localStorage.getItem("isAdmin");
    if (adminFlag === "true") {
      setIsAdmin(true);
    }
    
    // Restore user from localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("currentUser");
      }
    }
    
    setLoading(false);
  }, []);

  // Admin login
  const loginAdmin = (username, password) => {
    if (username === adminUsername && password === adminPassword) {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      loadAdminBookings();
      return true;
    }
    return false;
  };

  // Change admin credentials
  const changeAdminCredentials = (username, password) => {
    setAdminUsername(username);
    setAdminPassword(password);
  };

  // Admin logout
  const logoutAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
    navigate("/admin");
  };

  // Trip management (still local for now)
  const addTrip = (trip) => {
    setTrips((prev) => [...prev, trip]);
  };
  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const value = {
    user,
    users,
    bookings,
    setUser,
    addUser,
    loginUser,
    logout,
    addBooking,
    getBookings,
    isAdmin,
    setIsAdmin,
    loginAdmin,
    logoutAdmin,
    adminUsername,
    adminPassword,
    changeAdminCredentials,
    trips,
    addTrip,
    deleteTrip,
    setUsers,
    setBookings,
    loading,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
