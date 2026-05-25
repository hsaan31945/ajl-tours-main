import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useAdmin } from "../context/AdminContext";

// Use environment variables for production compatibility
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : "/api";
const SOCKET_URL = process.env.NODE_ENV === 'production' ? window.location.origin : window.location.origin;

const AdminDivisions = () => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentDivision, setCurrentDivision] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    banner_image: ""
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
      return;
    }

    // Fetch divisions
    const fetchDivisions = async () => {
      try {
        const res = await axios.get(`${API_URL}/divisions`);
        setDivisions(res.data);
      } catch (err) {
        console.error("Failed to fetch divisions:", err);
      }
    };

    fetchDivisions();

    // Real-time updates
    const socket = io(SOCKET_URL);
    socket.on("divisionCreated", (division) => {
      setDivisions((prev) => [...prev, division]);
    });
    socket.on("divisionUpdated", (division) => {
      setDivisions((prev) => prev.map(d => d.id === division.id ? division : d));
    });
    socket.on("divisionDeleted", (id) => {
      setDivisions((prev) => prev.filter(d => d.id !== Number(id)));
    });

    return () => socket.disconnect();
  }, [isAdmin, navigate]);

  const handleAddDivision = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/divisions`, formData);
      setShowAddModal(false);
      setFormData({ name: "", description: "", banner_image: "" });
    } catch (err) {
      alert("Failed to add division: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditDivision = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/divisions/${currentDivision.id}`, formData);
      setShowEditModal(false);
      setCurrentDivision(null);
      setFormData({ name: "", description: "", banner_image: "" });
    } catch (err) {
      alert("Failed to update division: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDivisions = async () => {
    try {
      await Promise.all(selected.map(id => axios.delete(`${API_URL}/divisions/${id}`)));
      setSelected([]);
      setDeleteMode(false);
      setShowConfirm(false);
    } catch (err) {
      alert("Failed to delete divisions: " + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (division) => {
    setCurrentDivision(division);
    setFormData({
      name: division.name,
      description: division.description || "",
      banner_image: division.banner_image || ""
    });
    setShowEditModal(true);
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">Division Management</h1>
      
      <div className="flex gap-4 mb-6">
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
            onClick={() => setShowAddModal(true)}
          >
            Add Division
          </button>
        )}
        {!deleteMode && (
          <button
            className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-800"
            onClick={() => setDeleteMode(true)}
          >
            Remove Division
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
              <th className="py-2 px-4">Division Name</th>
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4">Banner Image</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {divisions.length === 0 ? (
              <tr>
                <td colSpan={deleteMode ? 5 : 4} className="text-center py-4">No divisions found.</td>
              </tr>
            ) : (
              divisions.map((division) => (
                <tr key={division.id}>
                  {deleteMode && (
                    <td className="py-2 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(division.id)}
                        onChange={() => toggleSelect(division.id)}
                      />
                    </td>
                  )}
                  <td className="py-2 px-4 font-semibold">{division.name}</td>
                  <td className="py-2 px-4">{division.description || "No description"}</td>
                  <td className="py-2 px-4">
                    {division.banner_image ? (
                      <img src={division.banner_image} alt={division.name} className="w-16 h-12 object-cover rounded" />
                    ) : (
                      "No image"
                    )}
                  </td>
                  <td className="py-2 px-4">
                    {!deleteMode && (
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-800 mr-2"
                        onClick={() => openEditModal(division)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Division Modal */}
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
            <h3 className="text-xl font-bold mb-4">Add New Division</h3>
            <form onSubmit={handleAddDivision} className="space-y-4">
              <div>
                <label className="block text-md font-medium">Division Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Switzerland"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Describe this division/country/region"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-md font-medium">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.banner_image}
                  onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-800"
              >
                Create Division
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Division Modal */}
      {showEditModal && currentDivision && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-2 right-2 text-2xl text-red-600 hover:text-black"
              onClick={() => setShowEditModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Edit Division: {currentDivision.name}</h3>
            <form onSubmit={handleEditDivision} className="space-y-4">
              <div>
                <label className="block text-md font-medium">Division Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-md font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-md font-medium">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.banner_image}
                  onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-800"
              >
                Update Division
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
            <div className="mb-6">
              Are you sure you want to permanently delete the selected division(s)? 
              <br /><br />
              <strong>Warning:</strong> This will also delete all tours associated with these divisions!
            </div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-red-700 text-white rounded font-bold hover:bg-black"
                onClick={handleDeleteDivisions}
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

export default AdminDivisions;







