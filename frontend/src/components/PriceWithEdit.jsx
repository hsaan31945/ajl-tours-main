import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useAdmin } from "../context/AdminContext";
import { apiUrl } from "../utils/api";

// Reusable price component with admin inline edit support
// Props:
// - price: number (cents or major units depending on caller)
// - currencySymbol: string, e.g. "$" or "CHF"
// - tourId: optional backend tour id for API update
// - onSavePrice: optional callback(newPrice) for callers that need to save extra tour context
// - onUpdated: optional callback(newPrice)
export default function PriceWithEdit({
  price,
  currencySymbol = "CHF",
  tourId,
  onSavePrice,
  onUpdated,
  isAdmin = false,
}) {
  const { passcodeHeader } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState(price);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocalPrice(price);
  }, [price]);

  const handleSave = async () => {
    const parsed = Number(localPrice);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a valid non-negative number");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (onSavePrice) {
        const saved = await onSavePrice(parsed);
        if (!saved) throw new Error("Failed to save");
      } else if (tourId) {
        const response = await fetch(apiUrl(`/api/tours/${tourId}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            ...(passcodeHeader ? { "X-Admin-Passcode": passcodeHeader } : {}),
          },
          cache: "no-store",
          body: JSON.stringify({ price: parsed }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || data.error || "Failed to save");
        }
      } else {
        setError("Tour ID missing");
        return;
      }

      setIsEditing(false);
      if (onUpdated) onUpdated(parsed);
    } catch (e) {
      setError(e.message || "Failed to save");
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
