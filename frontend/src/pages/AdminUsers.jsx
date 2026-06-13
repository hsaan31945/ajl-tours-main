import React, { useEffect, useMemo, useState } from "react";
import { Eye, Plus, Search, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, ConfirmModal, EmptyState, LoadingState } from "../components/admin/AdminUI";
import { adminRequest, asArray, asObject, formatDate, money } from "../utils/adminApi";

const emptyForm = { name: "", email: "", phone: "", password: "" };

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search.trim()) params.set("q", search.trim());
      const payload = await adminRequest(`/api/admin/users?${params.toString()}`, { getAuthHeader });
      setUsers(asArray(payload));
      setPagination(payload.pagination || { page, totalPages: 1, total: asArray(payload).length });
    } catch (err) {
      setError(err.message || "Could not load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleUsers = useMemo(() => users, [users]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await adminRequest("/api/admin/users", {
        method: "POST",
        getAuthHeader,
        body: form,
      });
      setMessage("User created.");
      setShowAdd(false);
      setForm(emptyForm);
      loadUsers();
    } catch (err) {
      setError(err.message || "Could not create user");
    }
  };

  const openDetails = async (user) => {
    setError("");
    try {
      const payload = await adminRequest(`/api/admin/users/${user.id}`, { getAuthHeader });
      setSelectedUser(asObject(payload));
    } catch (err) {
      setError(err.message || "Could not load user details");
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      await adminRequest(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
        getAuthHeader,
      });
      setDeleteUser(null);
      setMessage("User deactivated.");
      loadUsers();
    } catch (err) {
      setError(err.message || "Could not deactivate user");
    }
  };

  if (adminLoading || loading) return <LoadingState label="Loading users..." />;

  return (
    <AdminPage
      title="Users Management"
      description="Search customers, view booking history, and create manual user accounts when needed."
      actions={(
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700">
          <Plus className="h-4 w-4" /> Add User
        </button>
      )}
    >
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}

      <AdminCard>
        <form onSubmit={handleSearch} className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Search by name, email, or phone"
            />
          </div>
          <button className="rounded-lg bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black">Search</button>
        </form>

        {!visibleUsers.length ? (
          <EmptyState title="No users found" message="Users who register on the public website will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-gray-500">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Registered</th>
                  <th className="py-3 pr-4">Bookings</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">{user.phone || "-"}</td>
                    <td className="py-3 pr-4 text-gray-700">{formatDate(user.createdAt)}</td>
                    <td className="py-3 pr-4 font-bold text-gray-900">{user.totalBookings || 0}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => openDetails(user)} className="mr-3 inline-flex items-center gap-1 font-bold text-orange-700">
                        <Eye className="h-4 w-4" /> View
                      </button>
                      <button onClick={() => setDeleteUser(user)} className="inline-flex items-center gap-1 font-bold text-red-600">
                        <Trash2 className="h-4 w-4" /> Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm text-gray-600">
          <span>{pagination.total || 0} user{pagination.total === 1 ? "" : "s"}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40">Prev</button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40">Next</button>
          </div>
        </div>
      </AdminCard>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleAddUser} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">Add User</h2>
            <div className="mt-5 grid gap-4">
              {[
                ["name", "Full Name", "text"],
                ["email", "Email", "email"],
                ["phone", "Phone", "tel"],
                ["password", "Password", "password"],
              ].map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="text-sm font-bold text-gray-700">{label}</span>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    required={key !== "phone"}
                    minLength={key === "password" ? 6 : undefined}
                  />
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 font-bold">Cancel</button>
              <button className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700">Create User</button>
            </div>
          </form>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedUser.user?.name}</h2>
                <p className="text-sm text-gray-500">{selectedUser.user?.email}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="rounded-lg border px-3 py-2 font-bold">Close</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <AdminCard><User className="mb-2 h-5 w-5 text-orange-700" /><p className="text-xs font-bold text-gray-500">Phone</p><p className="font-bold">{selectedUser.user?.phone || "-"}</p></AdminCard>
              <AdminCard><p className="text-xs font-bold text-gray-500">Registered</p><p className="font-bold">{formatDate(selectedUser.user?.createdAt)}</p></AdminCard>
              <AdminCard><p className="text-xs font-bold text-gray-500">Bookings</p><p className="font-bold">{selectedUser.bookings?.length || 0}</p></AdminCard>
            </div>
            <h3 className="mt-6 font-bold text-gray-900">Booking History</h3>
            <div className="mt-3 space-y-3">
              {!selectedUser.bookings?.length ? <EmptyState title="No bookings" /> : selectedUser.bookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-900">{booking.tourName}</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.travelDate)} - {booking.travelers} traveler{booking.travelers === 1 ? "" : "s"}</p>
                    </div>
                    <p className="font-bold">{money(booking.totalAmount, booking.currency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <ConfirmModal
          title="Deactivate User"
          message={`Deactivate ${deleteUser.name}? Their booking records will remain available for reporting.`}
          confirmLabel="Deactivate"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteUser(null)}
        />
      )}
    </AdminPage>
  );
};

export default AdminUsers;
