import React, { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle, Clock, Download, ShoppingBag, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, EmptyState, LoadingState, StatCard, StatusBadge } from "../components/admin/AdminUI";
import { adminRequest, asArray, asObject, formatDate, money, statusLabel } from "../utils/adminApi";

const AdminTravelRecords = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ status: "all", month: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.month) params.set("month", filters.month);
      const [recordPayload, statsPayload] = await Promise.all([
        adminRequest(`/api/admin/bookings?${params.toString()}`, { getAuthHeader }),
        adminRequest("/api/admin/bookings/stats", { getAuthHeader }),
      ]);
      setRecords(asArray(recordPayload));
      setStats(asObject(statsPayload));
    } catch (err) {
      setError(err.message || "Could not load travel records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadRecords();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    const headers = ["Customer", "Email", "Phone", "Tour", "Travel Date", "Amount", "Status"];
    const rows = records.map((record) => [
      record.customerName,
      record.email,
      record.phone,
      record.tourName,
      formatDate(record.travelDate),
      Number(record.totalAmount || 0).toFixed(2),
      statusLabel(record.status),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ajl-travel-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (adminLoading || loading) return <LoadingState label="Loading travel records..." />;

  return (
    <AdminPage
      title="Travel Records"
      description="Booking records and revenue reporting from the live database."
      actions={(
        <button onClick={exportCsv} disabled={!records.length} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 font-bold text-white hover:bg-black disabled:opacity-40">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      )}
    >
      {error && <Alert>{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Bookings" value={stats.totalBookings || 0} icon={ShoppingBag} tone="gray" />
        <StatCard title="Pending" value={stats.pendingBookings || 0} icon={Clock} tone="yellow" />
        <StatCard title="Confirmed" value={stats.confirmedBookings || 0} icon={CheckCircle} tone="green" />
        <StatCard title="Completed" value={stats.completedBookings || 0} icon={CalendarCheck} tone="blue" />
        <StatCard title="Cancelled" value={stats.cancelledBookings || 0} icon={XCircle} tone="red" />
        <StatCard title="Revenue" value={money(stats.totalRevenue || 0)} icon={CheckCircle} tone="green" />
      </div>

      <AdminCard className="mt-6">
        <form onSubmit={(event) => { event.preventDefault(); loadRecords(); }} className="mb-5 grid gap-3 sm:grid-cols-[180px_180px_110px]">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-gray-300 px-3 py-3">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="rounded-lg border border-gray-300 px-3 py-3" />
          <button className="rounded-lg bg-gray-900 px-4 py-3 font-bold text-white hover:bg-black">Apply</button>
        </form>

        {!records.length ? (
          <EmptyState title="No travel records" message="Bookings will appear here once customers complete or create orders." />
        ) : (
          <div className="grid gap-4">
            {records.map((record) => (
              <div key={record.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-gray-900">{record.customerName}</h2>
                      <StatusBadge status={record.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{record.email || "-"} {record.phone ? `- ${record.phone}` : ""}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{record.tourName}</p>
                  </div>
                  <div className="grid gap-3 text-sm sm:grid-cols-3 md:text-right">
                    <div><p className="font-bold text-gray-500">Travel Date</p><p>{formatDate(record.travelDate)}</p></div>
                    <div><p className="font-bold text-gray-500">Travelers</p><p>{record.travelers}</p></div>
                    <div><p className="font-bold text-gray-500">Amount</p><p className="font-bold text-gray-900">{money(record.totalAmount, record.currency)}</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
};

export default AdminTravelRecords;
