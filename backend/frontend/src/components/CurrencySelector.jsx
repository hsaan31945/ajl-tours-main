import React from "react";
import { ChevronDown, CircleDollarSign } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";

const CurrencySelector = ({ compact = false, className = "" }) => {
  const { currency, setCurrency, SUPPORTED_CURRENCIES } = useCurrency();

  return (
    <label
      className={`relative inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-300 hover:text-orange-600 ${className}`}
      title="Select currency"
    >
      <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
      {!compact && <span className="text-xs text-gray-500">Currency</span>}
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
        className="appearance-none bg-transparent pr-5 font-bold text-gray-800 outline-none cursor-pointer"
        aria-label="Select currency"
      >
        {SUPPORTED_CURRENCIES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.code}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-gray-400" aria-hidden="true" />
    </label>
  );
};

export default CurrencySelector;
