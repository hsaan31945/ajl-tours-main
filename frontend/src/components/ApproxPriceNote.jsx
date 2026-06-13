import React from "react";
import { useCurrency } from "../context/CurrencyContext";

const ApproxPriceNote = ({ className = "" }) => {
  const { currency, baseCurrency, ratesError } = useCurrency();
  if (currency === baseCurrency) return null;

  return (
    <p className={`mt-1 text-xs font-medium text-gray-500 ${className}`}>
      Converted prices are approximate and may vary.
      {ratesError ? " Latest stored rates are being used." : ""}
    </p>
  );
};

export default ApproxPriceNote;
