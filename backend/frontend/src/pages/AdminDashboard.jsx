import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAdmin } from "../context/AdminContext";

const AdminDashboard = () => {
  const { users, bookings, loading: appLoading } = useContext(AppContext);
  const { isAdmin, loading: adminLoading, passcodeHeader } = useAdmin();
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  
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
            <button
              onClick={async () => {
                if (!confirm('This will migrate all hardcoded tours to the database. Continue?')) return;
                setMigrating(true);
                try {
                  const headers = passcodeHeader ? { 'X-Admin-Passcode': passcodeHeader } : {};
                  const res = await axios.post('/api/migrate-tours', {}, { headers });
                  alert(`Success! ${res.data.message}`);
                  window.location.reload();
                } catch (error) {
                  alert('Migration failed: ' + (error.response?.data?.message || error.message));
                } finally {
                  setMigrating(false);
                }
              }}
              disabled={migrating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {migrating ? 'Migrating...' : 'Migrate Hardcoded Tours to DB'}
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