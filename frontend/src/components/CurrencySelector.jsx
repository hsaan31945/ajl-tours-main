import React, { useState } from "react";
import { ChevronDown, CircleDollarSign } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import PreferencesModal from "./PreferencesModal";

const CurrencySelector = ({ compact = false, className = "" }) => {
  const { currency, selectedCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const compactLabel = selectedCurrency?.symbol && selectedCurrency.symbol !== currency
    ? `${currency} ${selectedCurrency.symbol}`
    : currency;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600 ${className}`}
        title="Select currency"
        aria-label="Select currency"
      >
        <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
        {!compact && <span className="text-xs text-gray-500">Currency</span>}
        <span className="pr-5 font-bold text-gray-800">
          {compact ? compactLabel : selectedCurrency?.name || currency}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" aria-hidden="true" />
      </button>

      {open && <PreferencesModal mode="currency" onClose={() => setOpen(false)} />}
    </>
  );
};

export default CurrencySelector;
