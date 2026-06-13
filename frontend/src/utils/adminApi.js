import { apiUrl } from "./api";

export const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const asObject = (payload) => payload?.data || payload || {};

export const getRecordId = (record) => String(
  record?._id ||
  record?.id ||
  record?.bookingId ||
  record?.booking_id ||
  record?.databaseId ||
  ""
).trim();

export const money = (value, currency = "CHF") => {
  const number = Number(value);
  return `${currency}${Number.isFinite(number) ? number.toFixed(2) : "0.00"}`;
};

export const formatDate = (value, options = {}) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
};

export const statusLabel = (value) => {
  const text = String(value || "pending").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const buildAdminHeaders = (getAuthHeader, extra = {}) => ({
  ...(getAuthHeader ? getAuthHeader() : {}),
  ...extra,
});

export const adminRequest = async (path, { getAuthHeader, method = "GET", body, headers = {} } = {}) => {
  const response = await fetch(apiUrl(path), {
    method,
    headers: buildAdminHeaders(getAuthHeader, {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
};
