import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useCurrency } from "../context/CurrencyContext";
import { useAdmin } from "../context/AdminContext";

// Use environment variables for production compatibility
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : "/api";
const SOCKET_URL = process.env.NODE_ENV === 'production' ? window.location.origin : window.location.origin;

const AdminOrders = () => {
  const { bookings, users, trips, setBookings } = useContext(AppContext);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [month, setMonth] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [requestText, setRequestText] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    travelers: 1,
    specialRequests: "",
    tourTitle: "",
    totalPrice: "",
    tripDate: "",
    address: "",
    lat: "",
    lng: "",
    status: "Pending"
  });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const { symbol, rate } = useCurrency();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
    // Listen for real-time booking updates
    const socket = io(SOCKET_URL);
    socket.on("bookingUpdated", (updatedBooking) => {
      setBookings((prev) => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    });
    socket.on("bookingDeleted", (id) => {
      setBookings((prev) => prev.filter(b => b.id !== Number(id)));
    });
    return () => socket.disconnect();
  }, [isAdmin, navigate, setBookings]);

  // Helper to get user name by email
  const getUserName = (email) => {
    const user = users.find((u) => u.email === email);
    return user ? user.name : email;
  };

  // Filter bookings by selected month/year
  const filteredBookings = month
    ? bookings.filter((b) => {
        if (!b.tripDate) return false;
        const d = new Date(b.tripDate);
        return (
          d.getMonth() + 1 === parseInt(month.split("-")[1]) &&
          d.getFullYear() === parseInt(month.split("-")[0])
        );
      })
    : bookings;

  // Handle status update
  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`${API_URL}/bookings/${id}/status`, { status });
      // Real-time update will update state
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/bookings`, addForm);
      setBookings((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        travelers: 1,
        specialRequests: "",
        tourTitle: "",
        totalPrice: "",
        tripDate: "",
        address: "",
        lat: "",
        lng: "",
        status: "Pending"
      });
    } catch (err) {
      alert("Failed to add order: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteOrders = async () => {
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/bookings/${id}`)));
      setBookings((prev) => prev.filter(b => !selected.includes(b.id)));
      setSelected([]);
      setDeleteMode(false);
      setShowConfirm(false);
    } catch (err) {
      alert("Failed to delete orders: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">Order Management</h1>
      <div className="flex gap-4 mb-6">
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
            onClick={() => setShowAddModal(true)}
          >
            Add Order
          </button>
        )}
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-800"
            onClick={() => setDeleteMode(true)}
          >
            Remove Order
          </button>
        )}
        {deleteMode && (
          <button
            className="px-4 py-2 bg-red-700 text-white rounded font-bold hover:bg-black"
            onClick={() => setShowConfirm(true)}
            disabled={selected.length === 0}
          >
            Delete Selected
          </button>
        )}
        {deleteMode && (
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-600"
            onClick={() => { setDeleteMode(false); setSelected([]); }}
          >
            Cancel
          </button>
        )}
      </div>
      <div className="bg-white p-6 rounded-lg shadow mb-8 max-w-md mx-auto">
        <label className="block text-md font-medium mb-2">Filter by Month/Year</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
        />
      </div>
      <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4">All Orders</h2>
        <table className="min-w-full">
          <thead>
            <tr>
              {deleteMode && <th className="py-2 px-2">Sel</th>}
              <th className="py-2 px-2">#</th>
              <th className="py-2 px-2">User</th>
              <th className="py-2 px-2">Email</th>
              <th className="py-2 px-2">Addr</th>
              <th className="py-2 px-2">Trip</th>
              <th className="py-2 px-2">Trav</th>
              <th className="py-2 px-2">Price</th>
              <th className="py-2 px-2">Reg</th>
              <th className="py-2 px-2">Date</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Req</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={deleteMode ? 12 : 11} className="text-center py-4">No orders found.</td>
              </tr>
            ) : (
              filteredBookings.map((b, idx) => {
                const user = users.find((u) => u.email === b.email);
                return (
                  <tr key={b.id}>
                    {deleteMode && (
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(b.id)}
                          onChange={() => toggleSelect(b.id)}
                        />
                      </td>
                    )}
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2">{getUserName(b.email)}</td>
                    <td className="py-2 px-2">{b.email}</td>
                    <td className="py-2 px-2">{b.address || "-"}</td>
                    <td className="py-2 px-2">{b.tourTitle || b.tripName || "-"}</td>
                    <td className="py-2 px-2">{b.travelers}</td>
                    <td className="py-2 px-2">
                      <div>{symbol}{(b.totalPrice * rate).toFixed(2)}</div>
                      {Number(b.groupDiscountTotal || 0) > 0 && (
                        <div className="text-xs font-semibold text-green-700">
                          Group -{symbol}{(Number(b.groupDiscountTotal) * rate).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2">{user && user.registrationDate ? new Date(user.registrationDate).toLocaleDateString("en-US", { year: "2-digit", month: "short", day: "numeric" }) : "-"}</td>
                    <td className="py-2 px-2">{b.tripDate ? new Date(b.tripDate).toLocaleDateString("en-US", { year: "2-digit", month: "short", day: "numeric" }) : "-"}</td>
                    <td className="py-2 px-2 font-semibold">
                      <select
                        value={b.status || "Pending"}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                        className="border rounded px-1 py-1 text-xs"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Not Confirmed">Not Confirmed</option>
                      </select>
                    </td>
                    <td className="py-2 px-2">
                      {b.specialRequests ? (
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-800 text-xs"
                          onClick={() => { setShowRequest(true); setRequestText(b.specialRequests); }}
                        >
                          View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Special Request Popup */}
        {showRequest && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full relative">
              <button
                className="absolute top-2 right-2 text-2xl text-red-600 hover:text-black"
                onClick={() => setShowRequest(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4">Special Request</h3>
              <div className="text-gray-800 whitespace-pre-line">{requestText}</div>
            </div>
          </div>
        )}
      </div>
      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-2xl text-red-600 hover:text-black"
              onClick={() => setShowAddModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Add Order</h3>
            <form onSubmit={handleAddOrder} className="space-y-4">
              <div>
                <label className="block text-md font-medium">Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Number of Travelers</label>
                <input
                  type="number"
                  value={addForm.travelers}
                  onChange={e => setAddForm(f => ({ ...f, travelers: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Total Price</label>
                <input
                  type="number"
                  value={addForm.totalPrice}
                  onChange={e => setAddForm(f => ({ ...f, totalPrice: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Trip Name</label>
                <input
                  type="text"
                  value={addForm.tourTitle}
                  onChange={e => setAddForm(f => ({ ...f, tourTitle: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Trip Date</label>
                <input
                  type="date"
                  value={addForm.tripDate}
                  onChange={e => setAddForm(f => ({ ...f, tripDate: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-md font-medium">Address</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-md font-medium">Latitude</label>
                <input
                  type="number"
                  value={addForm.lat}
                  onChange={e => setAddForm(f => ({ ...f, lat: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-md font-medium">Longitude</label>
                <input
                  type="number"
                  value={addForm.lng}
                  onChange={e => setAddForm(f => ({ ...f, lng: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-md font-medium">Status</label>
                <select
                  value={addForm.status}
                  onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Not Confirmed">Not Confirmed</option>
                </select>
              </div>
              <div>
                <label className="block text-md font-medium">Special Requests</label>
                <textarea
                  value={addForm.specialRequests}
                  onChange={e => setAddForm(f => ({ ...f, specialRequests: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
              >
                Add Order
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Popup */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-2xl text-red-600 hover:text-black"
              onClick={() => setShowConfirm(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <div className="mb-6">Are you sure you want to permanently delete the selected order(s)?</div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-700 text-white rounded font-bold hover:bg-black"
                onClick={handleDeleteOrders}
              >
                Yes, Delete
              </button>
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded font-bold hover:bg-gray-600"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 
