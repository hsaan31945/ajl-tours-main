import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useAdmin } from "../context/AdminContext";

// Use environment variables for production compatibility
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : "/api";
const SOCKET_URL = process.env.NODE_ENV === 'production' ? window.location.origin : window.location.origin;

const AdminUsers = () => {
  const { users, bookings, setUsers } = useContext(AppContext);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
    // Real-time user delete
    const socket = io(SOCKET_URL);
    socket.on("userDeleted", (id) => {
      setUsers((prev) => prev.filter(u => u.id !== Number(id)));
    });
    return () => socket.disconnect();
  }, [isAdmin, navigate, setUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/users`, addForm);
      setUsers((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setAddForm({ name: "", email: "", password: "", phone: "" });
      alert("User added successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to add user";
      alert("Error: " + errorMessage);
      console.error('Add user error:', err);
    }
  };

  const handleDeleteUsers = async () => {
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/users/${id}`)));
      setUsers((prev) => prev.filter(u => !selected.includes(u.id)));
      setSelected([]);
      setDeleteMode(false);
      setShowConfirm(false);
    } catch (err) {
      alert("Failed to delete users: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">User Management</h1>
      <div className="flex gap-4 mb-6">
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
            onClick={() => setShowAddModal(true)}
          >
            Add User
          </button>
        )}
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-800"
            onClick={() => setDeleteMode(true)}
          >
            Remove User
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
              <th className="py-2 px-4">Name</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Phone</th>
              <th className="py-2 px-4">Registration Date</th>
              <th className="py-2 px-4">Orders</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={deleteMode ? 6 : 5} className="text-center py-4">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  {deleteMode && (
                    <td className="py-2 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </td>
                  )}
                  <td className="py-2 px-4">{user.name}</td>
                  <td className="py-2 px-4">{user.email}</td>
                  <td className="py-2 px-4">{user.phone}</td>
                  <td className="py-2 px-4">N/A</td>
                  <td className="py-2 px-4">{bookings.filter((b) => b.email === user.email).length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Add User Modal */}
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
            <h3 className="text-xl font-bold mb-4">Add User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-md font-medium">Full Name</label>
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
                <label className="block text-md font-medium">Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
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
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
              >
                Add User
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
            <div className="mb-6">Are you sure you want to permanently delete the selected user(s)?</div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-700 text-white rounded font-bold hover:bg-black"
                onClick={handleDeleteUsers}
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

export default AdminUsers; 