import React from "react";
import { useCurrency } from "../context/CurrencyContext";

const CurrencySelector = () => {
  const { currency, setCurrency, SUPPORTED_CURRENCIES, loading } = useCurrency();

  return (
    <div className="w-full flex justify-center items-center py-2 bg-gray-100 border-b">
      <label htmlFor="currency-select" className="mr-2 font-medium">Currency:</label>
      <select
        id="currency-select"
        value={currency}
        onChange={e => setCurrency(e.target.value)}
        className="border rounded px-2 py-1"
        disabled={loading}
      >
        {SUPPORTED_CURRENCIES.map(cur => (
          <option key={cur.code} value={cur.code}>{cur.code} ({cur.symbol})</option>
        ))}
      </select>
      {loading && <span className="ml-3 text-sm text-gray-500">Updating rate...</span>}
    </div>
  );
};

export default CurrencySelector; 