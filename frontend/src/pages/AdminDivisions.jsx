import React, { useEffect, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";
import { AdminCard, AdminPage, Alert, ConfirmModal, EmptyState, LoadingState, StatusBadge } from "../components/admin/AdminUI";
import { adminRequest, asArray } from "../utils/adminApi";

const emptyForm = { name: "", slug: "", description: "", bannerImage: "", isActive: true };

const slugify = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const AdminDivisions = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, getAuthHeader } = useAdmin();
  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [deleteDivision, setDeleteDivision] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate("/admin");
  }, [adminLoading, isAdmin, navigate]);

  const loadDivisions = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await adminRequest("/api/admin/divisions?includeInactive=true", { getAuthHeader });
      setDivisions(asArray(payload));
    } catch (err) {
      setError(err.message || "Could not load divisions");
      setDivisions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) loadDivisions();
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const openForm = (division = null) => {
    setEditing(division);
    setForm(division ? {
      name: division.name || "",
      slug: division.slug || slugify(division.name),
      description: division.description || "",
      bannerImage: division.bannerImage || division.banner_image || "",
      isActive: division.isActive !== false,
    } : emptyForm);
    setShowForm(true);
  };

  const saveDivision = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const path = editing ? `/api/admin/divisions/${editing.id}` : "/api/admin/divisions";
      await adminRequest(path, {
        method: editing ? "PUT" : "POST",
        getAuthHeader,
        body: { ...form, slug: form.slug || slugify(form.name) },
      });
      setMessage(editing ? "Division updated." : "Division created.");
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      loadDivisions();
    } catch (err) {
      setError(err.message || "Could not save division");
    }
  };

  const confirmDelete = async () => {
    if (!deleteDivision) return;
    try {
      await adminRequest(`/api/admin/divisions/${deleteDivision.id}`, {
        method: "DELETE",
        getAuthHeader,
      });
      setMessage("Division deactivated.");
      setDeleteDivision(null);
      loadDivisions();
    } catch (err) {
      setError(err.message || "Could not delete division");
      setDeleteDivision(null);
    }
  };

  if (adminLoading || loading) return <LoadingState label="Loading divisions..." />;

  return (
    <AdminPage
      title="Division Management"
      description="Manage public destinations and the destination banner images used across the website."
      actions={(
        <button onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700">
          <Plus className="h-4 w-4" /> Add Division
        </button>
      )}
    >
      {message && <Alert type="success">{message}</Alert>}
      {error && <Alert>{error}</Alert>}

      <AdminCard>
        {!divisions.length ? (
          <EmptyState title="No divisions found" message="Create Switzerland, Sri Lanka, or other destinations here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {divisions.map((division) => (
              <div key={division.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="h-36 bg-gray-100">
                  {division.bannerImage ? (
                    <img src={division.bannerImage} alt={division.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">No banner image</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-gray-900">{division.name}</h2>
                      <p className="text-sm text-gray-500">/{division.slug || slugify(division.name)}</p>
                    </div>
                    <StatusBadge status={division.isActive ? "active" : "inactive"} />
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-gray-600">{division.description || "No description yet."}</p>
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => openForm(division)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={() => setDeleteDivision(division)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form onSubmit={saveDivision} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">{editing ? "Edit Division" : "Add Division"}</h2>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-bold text-gray-700">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug || slugify(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  required
                />
              </label>
              <label>
                <span className="text-sm font-bold text-gray-700">Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="switzerland"
                />
              </label>
              <label>
                <span className="text-sm font-bold text-gray-700">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                />
              </label>
              <label>
                <span className="text-sm font-bold text-gray-700">Banner Image URL</span>
                <input
                  value={form.bannerImage}
                  onChange={(event) => setForm((current) => ({ ...current, bannerImage: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="https://example.com/banner.webp"
                />
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                <span className="font-bold text-gray-700">Active destination</span>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700">Cancel</button>
              <button className="rounded-lg bg-orange-600 px-4 py-2 font-bold text-white hover:bg-orange-700">Save Division</button>
            </div>
          </form>
        </div>
      )}

      {deleteDivision && (
        <ConfirmModal
          title="Delete Division"
          message={`Deactivate ${deleteDivision.name}? Divisions assigned to tours cannot be deleted until tours are moved or removed.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDivision(null)}
        />
      )}
    </AdminPage>
  );
};

export default AdminDivisions;
