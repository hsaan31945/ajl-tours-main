import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, LoadingState } from "../components/admin/AdminUI";
import { adminRequest, asObject } from "../utils/adminApi";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [admin, setAdmin] = useState(null);
  const [form, setForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const loadSettings = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await adminRequest("/api/admin/settings", { getAuthHeader });
        const data = asObject(payload);
        setAdmin(data);
        setForm((current) => ({ ...current, username: data?.username || "" }));
      } catch (err) {
        setError(err.message || "Could not load settings");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [getAuthHeader, isAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword && form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      const payload = await adminRequest("/api/admin/settings", {
        method: "PUT",
        getAuthHeader,
        body: form,
      });
      const data = asObject(payload);
      setAdmin(data);
      setForm({
        username: data?.username || form.username,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage("Admin settings updated.");
    } catch (err) {
      setError(err.message || "Could not update settings");
    } finally {
      setSaving(false);
    }
  };

  if (adminLoading || loading) return <LoadingState label="Loading settings..." />;

  return (
    <AdminPage title="Admin Settings" description="Update admin username and password securely. Passwords are never exposed to the frontend.">
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <AdminCard>
          <div className="rounded-lg bg-orange-50 p-3 text-orange-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Current Admin</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-bold text-gray-500">Username</dt>
              <dd className="text-gray-900">{admin?.username || "-"}</dd>
            </div>
            <div>
              <dt className="font-bold text-gray-500">Email</dt>
              <dd className="text-gray-900">{admin?.email || "-"}</dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label>
              <span className="text-sm font-bold text-gray-700">Change Username</span>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                minLength={3}
                required
              />
            </label>
            <label>
              <span className="text-sm font-bold text-gray-700">Current Password</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                required
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-bold text-gray-700">New Password</span>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  minLength={6}
                  placeholder="Leave blank to keep current"
                />
              </label>
              <label>
                <span className="text-sm font-bold text-gray-700">Confirm New Password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  minLength={6}
                  placeholder="Repeat new password"
                />
              </label>
            </div>
            <div>
              <button disabled={saving} className="rounded-lg bg-orange-600 px-5 py-3 font-bold text-white hover:bg-orange-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </AdminCard>
      </div>
    </AdminPage>
  );
};

export default AdminSettings;
