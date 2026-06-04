import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { apiUrl } from "../utils/api";

const AdminDashboard = () => {
  const { users, bookings, loading: appLoading } = useContext(AppContext);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  
  const loading = appLoading || adminLoading;
  
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate, adminLoading]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchDivisions = async () => {
      try {
        const response = await fetch(apiUrl("/api/divisions"));
        if (!response.ok) return;

        const data = await response.json();
        const divisionList = Array.isArray(data) ? data : [];
        setDivisions(divisionList);

        if (!selectedDivision) {
          const switzerland = divisionList.find((division) => division.name === "Switzerland");
          const fallback = switzerland || divisionList[0];
          if (fallback) {
            setSelectedDivision(fallback._id || fallback.id);
          }
        }
      } catch (error) {
        console.error("Error fetching divisions:", error);
        setDivisions([]);
      }
    };

    fetchDivisions();
  }, [isAdmin, selectedDivision]);

  const handleCreateTour = () => {
    const params = selectedDivision ? `?division=${encodeURIComponent(selectedDivision)}` : "";
    navigate(`/tour-wizard${params}`);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Management Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">User Management</h2>
          <div className="text-lg">Total Users: {users.length}</div>
        </section>
        {/* Trip Management Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Trip Management</h2>
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-gray-700" htmlFor="tour-location">
              Add tour to location
            </label>
            <select
              id="tour-location"
              value={selectedDivision}
              onChange={(event) => setSelectedDivision(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              <option value="">Select location...</option>
              {divisions.map((division) => (
                <option key={division._id || division.id} value={division._id || division.id}>
                  {division.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateTour}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              Create New Tour
            </button>
            <button
              onClick={() => navigate("/admin/divisions")}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900"
            >
              Manage Locations
            </button>
            <button
              onClick={() => navigate("/admin/tours")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              Update Tours
            </button>
          </div>
        </section>
        {/* Stats Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
          <div className="text-lg">Total Bookings: {bookings.length}</div>
        </section>
        {/* Admin Settings Section */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Admin Settings</h2>
          {/* Change username/password functionality will go here */}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
