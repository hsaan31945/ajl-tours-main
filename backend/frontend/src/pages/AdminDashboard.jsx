import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { apiUrl } from "../utils/api";

const AdminDashboard = () => {
  const { users, bookings, loading: appLoading } = useContext(AppContext);
  const { isAdmin, loading: adminLoading, getAuthHeader, passcodeHeader } = useAdmin();
  const navigate = useNavigate();
  const [divisions, setDivisions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("switzerland");
  const [creatingTour, setCreatingTour] = useState(false);
  
  const loading = appLoading || adminLoading;

  const pageLocations = [
    { slug: "switzerland", name: "Switzerland" },
    { slug: "srilanka", name: "Srilanka" },
  ];

  const normalizeLocation = (value) => String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  
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
      } catch (error) {
        console.error("Error fetching divisions:", error);
        setDivisions([]);
      }
    };

    fetchDivisions();
  }, [isAdmin]);

  const findDivisionForLocation = (location) => {
    const target = normalizeLocation(location.name);
    return divisions.find((division) => normalizeLocation(division.name) === target);
  };

  const handleCreateTour = async () => {
    const location = pageLocations.find((item) => item.slug === selectedLocation) || pageLocations[0];
    let division = findDivisionForLocation(location);

    setCreatingTour(true);
    try {
      if (!division) {
        const headers = getAuthHeader
          ? getAuthHeader()
          : (passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {});
        const response = await fetch(apiUrl("/api/divisions"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({
            name: location.name,
            description: `Tours in ${location.name}`,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || "Could not create location");
        }

        division = await response.json();
        setDivisions((current) => [...current, division]);
      }

      const divisionId = division?._id || division?.id;
      const params = divisionId ? `?division=${encodeURIComponent(divisionId)}` : "";
      navigate(`/admin/tour-wizard${params}`);
    } catch (error) {
      alert(`Could not prepare ${location.name}. Please add it from Manage Locations first.\n\n${error.message}`);
    } finally {
      setCreatingTour(false);
    }
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
              value={selectedLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
              {pageLocations.map((location) => (
                <option key={location.slug} value={location.slug}>
                  {location.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateTour}
              disabled={creatingTour}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {creatingTour ? "Preparing..." : "Create New Tour"}
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
