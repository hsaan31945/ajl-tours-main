import React, { useEffect, useMemo, useState } from "react";
import { Eye, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, ConfirmModal, EmptyState, LoadingState, StatusBadge } from "../components/admin/AdminUI";
import { adminRequest, asArray, formatDate, getRecordId, money, statusLabel } from "../utils/adminApi";

const statuses = ["all", "pending", "confirmed", "completed", "cancelled"];

const shouldTryBookingFallback = (error) => (
  error?.status === 404
  || error?.status === 405
  || /route not found|method not allowed/i.test(error?.message || "")
);

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [tours, setTours] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "all", month: "", tourId: "all" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState(null);
  const [deleteOrder, setDeleteOrder] = useState(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.set(key, value);
      });
      const payload = await adminRequest(`/api/admin/bookings?${params.toString()}`, { getAuthHeader });
      setOrders(asArray(payload));
    } catch (err) {
      setError(err.message || "Could not load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadOrders();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAdmin) return;
    const loadTours = async () => {
      try {
        const payload = await fetch("/api/tours?full=true", { cache: "no-store" }).then((res) => res.json());
        setTours(Array.isArray(payload) ? payload : []);
      } catch {
        setTours([]);
      }
    };
    loadTours();
  }, [isAdmin]);

  const total = useMemo(() => orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0), [orders]);

  const updateStatus = async (order, status) => {
    setError("");
    setMessage("");
    const orderId = getRecordId(order);
    if (!orderId) {
      setError("Could not update status because this booking is missing its database ID. Refresh the page and try again.");
      return;
    }
    try {
      let payload;
      try {
        payload = await adminRequest(`/api/admin/bookings/${orderId}/status`, {
          method: "PUT",
          getAuthHeader,
          body: { status },
        });
      } catch (primaryError) {
        if (!shouldTryBookingFallback(primaryError)) throw primaryError;
        payload = await adminRequest(`/api/bookings/${orderId}/status`, {
          method: "PUT",
          getAuthHeader,
          body: { status },
        });
      }
      const updated = payload.data || payload.booking || payload;
      setOrders((current) => current.map((item) => (
        getRecordId(item) === orderId ? { ...item, status: updated.status || status } : item
      )));
      setMessage(payload.message || "Order status updated.");
    } catch (err) {
      setError(err.message || "Could not update status");
    }
  };

  const confirmDelete = async () => {
    if (!deleteOrder) return;
    const orderId = getRecordId(deleteOrder);
    if (!orderId) {
      setError("Could not delete this order because it is missing its database ID. Refresh the page and try again.");
      setDeleteOrder(null);
      return;
    }
    try {
      try {
        await adminRequest(`/api/admin/bookings/${orderId}`, {
          method: "DELETE",
          getAuthHeader,
        });
      } catch (primaryError) {
        if (!shouldTryBookingFallback(primaryError)) throw primaryError;
        await adminRequest(`/api/bookings/${orderId}`, {
          method: "DELETE",
          getAuthHeader,
        });
      }
      setOrders((current) => current.filter((order) => getRecordId(order) !== orderId));
      setDeleteOrder(null);
      setMessage("Order deleted.");
    } catch (err) {
      setError(err.message || "Could not delete order");
    }
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    loadOrders();
  };

  if (adminLoading || loading) return <LoadingState label="Loading orders..." />;

  return (
    <AdminPage
      title="Orders Management"
      description="View every public booking, inspect customer details, and persist order status changes."
    >
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminCard><p className="text-sm font-bold text-gray-500">Orders Shown</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></AdminCard>
        <AdminCard><p className="text-sm font-bold text-gray-500">Shown Revenue</p><p className="mt-2 text-2xl font-bold">{money(total)}</p></AdminCard>
        <AdminCard><p className="text-sm font-bold text-gray-500">Pending in View</p><p className="mt-2 text-2xl font-bold">{orders.filter((order) => order.status === "pending").length}</p></AdminCard>
      </div>

      <AdminCard>
        <form onSubmit={handleFilterSubmit} className="mb-5 grid gap-3 lg:grid-cols-[1fr_160px_160px_220px_110px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Search user, email, phone, tour"
            />
          </div>
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className="rounded-lg border border-gray-300 px-3 py-3">
            {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
          </select>
          <input type="month" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} className="rounded-lg border border-gray-300 px-3 py-3" />
          <select value={filters.tourId} onChange={(event) => setFilters((current) => ({ ...current, tourId: event.target.value }))} className="rounded-lg border border-gray-300 px-3 py-3">
            <option value="all">All tours</option>
            {tours.map((tour) => <option key={tour._id || tour.id} value={tour._id || tour.id}>{tour.name}</option>)}
          </select>
          <button className="rounded-lg bg-gray-900 px-4 py-3 font-bold text-white hover:bg-black">Apply</button>
        </form>

        {!orders.length ? (
          <EmptyState title="No orders found" message="Bookings from the public website will appear here with customer and tour details." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-gray-500">
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Contact</th>
                  <th className="py-3 pr-4">Trip</th>
                  <th className="py-3 pr-4">Travel</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={getRecordId(order) || `${order.customerName}-${order.bookingDate}`}>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-900">{order.customerName}</div>
                      <div className="text-xs text-gray-500">Booked {formatDate(order.bookingDate)}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{order.email || "-"}</div>
                      <div className="text-xs text-gray-500">{order.phone || "-"}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-gray-900">{order.tourName}</div>
                      <div className="text-xs text-gray-500">{order.address || "No pickup address"}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div>{formatDate(order.travelDate)}</div>
                      <div className="text-xs text-gray-500">{order.travelers} traveler{order.travelers === 1 ? "" : "s"}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-900">{money(order.totalAmount, order.currency)}</div>
                      {Number(order.groupDiscountTotal || 0) > 0 && (
                        <div className="text-xs font-semibold text-green-700">Group -{money(order.groupDiscountTotal, order.currency)}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        value={order.status}
                        onChange={(event) => updateStatus(order, event.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold capitalize"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => setDetails(order)} className="mr-3 inline-flex items-center gap-1 font-bold text-orange-700">
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button onClick={() => setDeleteOrder(order)} className="inline-flex items-center gap-1 font-bold text-red-600">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <p className="text-sm text-gray-500">#{details.id}</p>
              </div>
              <button onClick={() => setDetails(null)} className="rounded-lg border px-3 py-2 font-bold">Close</button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail label="Customer" value={details.customerName} />
              <Detail label="Email" value={details.email} />
              <Detail label="Phone" value={details.phone} />
              <Detail label="Address" value={details.address} />
              <Detail label="Tour" value={details.tourName} />
              <Detail label="Travel Date" value={formatDate(details.travelDate)} />
              <Detail label="Travelers" value={details.travelers} />
              <Detail label="Booking Date" value={formatDate(details.bookingDate)} />
              <Detail label="Total" value={money(details.totalAmount, details.currency)} />
              <Detail label="Payment" value={statusLabel(details.paymentStatus)} />
            </div>
            <div className="mt-5">
              <p className="text-sm font-bold text-gray-500">Status</p>
              <div className="mt-1"><StatusBadge status={details.status} /></div>
            </div>
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-bold text-gray-500">Special Request</p>
              <p className="mt-1 whitespace-pre-line text-gray-800">{details.specialRequests || "None"}</p>
            </div>
          </div>
        </div>
      )}

      {deleteOrder && (
        <ConfirmModal
          title="Delete Order"
          message={`Delete booking for ${deleteOrder.customerName}? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOrder(null)}
        />
      )}
    </AdminPage>
  );
};

const Detail = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 p-4">
    <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
    <p className="mt-1 font-semibold text-gray-900">{value || "-"}</p>
  </div>
);

export default AdminOrders;
