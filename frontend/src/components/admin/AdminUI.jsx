import React from "react";

export const AdminPage = ({ title, description, actions, children }) => (
  <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  </div>
);

export const AdminCard = ({ children, className = "" }) => (
  <section className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
    {children}
  </section>
);

export const StatCard = ({ title, value, icon: Icon, tone = "orange" }) => {
  const tones = {
    orange: "bg-orange-50 text-orange-700",
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };
  return (
    <AdminCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-3 ${tones[tone] || tones.orange}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </AdminCard>
  );
};

export const StatusBadge = ({ status }) => {
  const value = String(status || "pending").toLowerCase();
  const classes = {
    pending: "bg-yellow-50 text-yellow-800 ring-yellow-200",
    confirmed: "bg-green-50 text-green-800 ring-green-200",
    completed: "bg-blue-50 text-blue-800 ring-blue-200",
    cancelled: "bg-red-50 text-red-800 ring-red-200",
    active: "bg-green-50 text-green-800 ring-green-200",
    inactive: "bg-gray-100 text-gray-700 ring-gray-200",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${classes[value] || classes.inactive}`}>
      {value}
    </span>
  );
};

export const EmptyState = ({ title = "Nothing here yet", message = "Records will appear here once they are available." }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
    <p className="font-bold text-gray-900">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{message}</p>
  </div>
);

export const LoadingState = ({ label = "Loading..." }) => (
  <div className="flex min-h-[280px] items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      <p className="mt-3 text-sm font-semibold text-gray-600">{label}</p>
    </div>
  </div>
);

export const Alert = ({ type = "error", children }) => {
  const styles = type === "success"
    ? "border-green-200 bg-green-50 text-green-800"
    : "border-red-200 bg-red-50 text-red-800";
  return <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${styles}`}>{children}</div>;
};

export const ConfirmModal = ({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger = true }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 font-bold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
