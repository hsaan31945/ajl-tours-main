import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "CHF", symbol: "CHF" },
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("CHF");
  const [rate, setRate] = useState(1); // 1 CHF = 1 CHF by default
  const [symbol, setSymbol] = useState("CHF");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Currency changed to:", currency);
    const fetchRate = async () => {
      setLoading(true);
      if (currency === "CHF") {
        setRate(1);
        setSymbol("CHF");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `https://open.er-api.com/v6/latest/CHF`
        );
        const data = await res.json();
        console.log("API response:", data);
        if (data && data.result === "success" && data.rates && data.rates["USD"]) {
          setRate(data.rates["USD"]);
          setSymbol("$");
          console.log("Fetched rate:", data.rates["USD"]);
        } else {
          throw new Error(data.error || "Invalid API response");
        }
      } catch (e) {
        console.error("Error fetching exchange rate:", e);
        setRate(1);
        setSymbol("CHF");
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, [currency]);

  useEffect(() => {
    console.log("CurrencyProvider render:", { currency, rate, symbol });
  });

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rate, symbol, loading, SUPPORTED_CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext); 