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

const AdminTrips = () => {
  const { trips, setTrips } = useContext(AppContext);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", price: "" });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const { symbol, rate } = useCurrency();

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
    // Real-time trip add/delete
    const socket = io(SOCKET_URL);
    socket.on("tripCreated", (trip) => {
      setTrips((prev) => [...prev, trip]);
    });
    socket.on("tripDeleted", (id) => {
      setTrips((prev) => prev.filter(t => t.id !== Number(id)));
    });
    // Initial fetch (in case not loaded)
    const fetchTrips = async () => {
      const res = await axios.get(`${API_URL}/trips`);
      setTrips(res.data);
    };
    fetchTrips();
    return () => socket.disconnect();
  }, [isAdmin, navigate, setTrips]);

  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/trips`, { ...addForm });
      setTrips((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setAddForm({ name: "", price: "" });
    } catch (err) {
      alert("Failed to add trip: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTrips = async () => {
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/trips/${id}`)));
      setTrips((prev) => prev.filter(t => !selected.includes(t.id)));
      setSelected([]);
      setDeleteMode(false);
      setShowConfirm(false);
    } catch (err) {
      alert("Failed to delete trips: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">Trip Management</h1>
      <div className="flex gap-4 mb-6">
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
            onClick={() => setShowAddModal(true)}
          >
            Add Trip
          </button>
        )}
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-800"
            onClick={() => setDeleteMode(true)}
          >
            Remove Trip
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
      <div className="bg-white p-6 rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr>
              {deleteMode && <th className="py-2 px-4">Select</th>}
              <th className="py-2 px-4">Trip Name</th>
              <th className="py-2 px-4">Price</th>
            </tr>
          </thead>
          <tbody>
            {trips.length === 0 ? (
              <tr>
                <td colSpan={deleteMode ? 3 : 2} className="text-center py-4">No trips found.</td>
              </tr>
            ) : (
              trips.map((trip) => (
                <tr key={trip.id}>
                  {deleteMode && (
                    <td className="py-2 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(trip.id)}
                        onChange={() => toggleSelect(trip.id)}
                      />
                    </td>
                  )}
                  <td className="py-2 px-4">{trip.name}</td>
                  <td className="py-2 px-4">{symbol}{(trip.price * rate).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add Trip Modal */}
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
            <h3 className="text-xl font-bold mb-4">Add Trip</h3>
            <form onSubmit={handleAddTrip} className="space-y-4">
              <div>
                <label className="block text-md font-medium">Trip Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Price</label>
                <input
                  type="number"
                  value={addForm.price}
                  onChange={e => setAddForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
              >
                Add Trip
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
            <div className="mb-6">Are you sure you want to permanently delete the selected trip(s)?</div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-700 text-white rounded font-bold hover:bg-black"
                onClick={handleDeleteTrips}
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

export default AdminTrips; 