import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, CheckCircle, Clock, Compass, Image, Map, Plus, ShoppingBag, Users, XCircle } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, EmptyState, LoadingState, StatCard, StatusBadge } from "../components/admin/AdminUI";
import { adminRequest, asObject, formatDate, money } from "../utils/adminApi";

const quickActions = [
  { label: "Create Tour", path: "/admin/tour-wizard", icon: Plus },
  { label: "Manage Tours", path: "/admin/tours", icon: Compass },
  { label: "Manage Bookings", path: "/admin/orders", icon: ShoppingBag },
  { label: "Manage Hero Banners", path: "/admin/hero-banners", icon: Image },
  { label: "Manage Divisions", path: "/admin/divisions", icon: Map },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await adminRequest("/api/admin/summary", { getAuthHeader });
        setSummary(asObject(payload));
      } catch (err) {
        setError(err.message || "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [getAuthHeader, isAdmin]);

  if (adminLoading || loading) return <LoadingState label="Loading dashboard..." />;

  return (
    <AdminPage
      title="Admin Dashboard"
      description="Live overview of AJL Tours users, tours, destinations, bookings, and revenue."
    >
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Users" value={summary?.totalUsers || 0} icon={Users} tone="blue" />
        <StatCard title="Total Tours" value={summary?.totalTours || 0} icon={Compass} tone="orange" />
        <StatCard title="Destinations" value={summary?.totalDivisions || 0} icon={Map} tone="green" />
        <StatCard title="Bookings" value={summary?.totalBookings || 0} icon={ShoppingBag} tone="gray" />
        <StatCard title="Revenue" value={money(summary?.totalRevenue || 0)} icon={CheckCircle} tone="green" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending" value={summary?.pendingBookings || 0} icon={Clock} tone="yellow" />
        <StatCard title="Confirmed" value={summary?.confirmedBookings || 0} icon={CheckCircle} tone="green" />
        <StatCard title="Completed" value={summary?.completedBookings || 0} icon={CalendarCheck} tone="blue" />
        <StatCard title="Cancelled" value={summary?.cancelledBookings || 0} icon={XCircle} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <AdminCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <button onClick={() => navigate("/admin/orders")} className="text-sm font-bold text-orange-700 hover:text-orange-800">
              View all
            </button>
          </div>

          {!summary?.recentBookings?.length ? (
            <EmptyState title="No bookings yet" message="New customer bookings will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase text-gray-500">
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 pr-4">Tour</th>
                    <th className="py-3 pr-4">Travel Date</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary.recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-3 pr-4">
                        <div className="font-bold text-gray-900">{booking.customerName}</div>
                        <div className="text-xs text-gray-500">{booking.email || "-"}</div>
                      </td>
                      <td className="py-3 pr-4 text-gray-700">{booking.tourName}</td>
                      <td className="py-3 pr-4 text-gray-700">{formatDate(booking.travelDate)}</td>
                      <td className="py-3 pr-4 font-bold text-gray-900">{money(booking.totalAmount, booking.currency)}</td>
                      <td className="py-3"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {quickActions.map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left font-bold text-gray-800 hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="rounded-lg bg-orange-50 p-2 text-orange-700">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </button>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminPage>
  );
};

export default AdminDashboard;
