import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import axios from "axios";
import { useAdmin } from "../context/AdminContext";

// Reusable price component with admin inline edit support
// Props:
// - price: number (cents or major units depending on caller)
// - currencySymbol: string, e.g. "$" or "CHF"
// - tourId: optional backend tour id for API update
// - storageKey: optional key to persist local override when no backend id
// - onUpdated: optional callback(newPrice)
export default function PriceWithEdit({
  price,
  currencySymbol = "CHF",
  tourId,
  storageKey,
  onUpdated,
  isAdmin = false,
}) {
  const { passcodeHeader } = useAdmin ? useAdmin() : { passcodeHeader: null };
  const [isEditing, setIsEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState(price);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load any locally overridden price
  useEffect(() => {
    if (storageKey) {
      try {
        const map = JSON.parse(localStorage.getItem("price_overrides") || "{}");
        if (map[storageKey] != null) {
          setLocalPrice(Number(map[storageKey]));
        } else {
          setLocalPrice(price);
        }
      } catch (_) {
        setLocalPrice(price);
      }
    } else {
      setLocalPrice(price);
    }
  }, [price, storageKey]);

  const persistLocal = (newPrice) => {
    if (!storageKey) return;
    try {
      const map = JSON.parse(localStorage.getItem("price_overrides") || "{}");
      map[storageKey] = newPrice;
      localStorage.setItem("price_overrides", JSON.stringify(map));
    } catch (_) {}
  };

  const handleSave = async () => {
    const parsed = Number(localPrice);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid non-negative number");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (tourId) {
        // Try backend update
        await axios.put(`/api/tours/${tourId}`, { price: parsed }, {
          headers: passcodeHeader ? { 'X-Admin-Passcode': passcodeHeader } : undefined
        });
      } else {
        // Fallback to local persistence
        persistLocal(parsed);
      }
      // Always store local override too for immediate UX and SSR/cache parity
      persistLocal(parsed);
      setIsEditing(false);
      if (onUpdated) onUpdated(parsed);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isEditing ? (
        <>
          <span className="text-lg sm:text-xl font-bold text-red-600">
            {currencySymbol}{Number(localPrice).toFixed(2)}
          </span>
          {isAdmin && (
            <button
              type="button"
              className="p-1 rounded hover:bg-gray-100"
              title="Edit price"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={localPrice}
            onChange={(e) => setLocalPrice(e.target.value)}
            className="w-28 border rounded px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setError("");
              setLocalPrice(price);
            }}
            className="px-3 py-1 rounded border text-sm"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
        </div>
      )}
    </div>
  );
}


