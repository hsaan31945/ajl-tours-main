import React, { useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const AdminDashboard = () => {
  const { users, bookings, loading: appLoading } = useContext(AppContext);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  
  const loading = appLoading || adminLoading;
  
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate, adminLoading]);

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
            <button
              onClick={() => navigate("/tour-wizard")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              Create New Tour
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
