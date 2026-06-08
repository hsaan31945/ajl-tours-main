import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const BASE_CURRENCY = "CHF";
export const CURRENCY_STORAGE_KEY = "ajl:selectedCurrency";

export const SUPPORTED_CURRENCIES = [
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
    rateFromChf: 1,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateFromChf: 1.06,
  },
];

const currencyByCode = SUPPORTED_CURRENCIES.reduce((acc, currency) => {
  acc[currency.code] = currency;
  return acc;
}, {});

const getStoredCurrency = () => {
  if (typeof window === "undefined") return BASE_CURRENCY;
  const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
  return currencyByCode[storedCurrency] ? storedCurrency : BASE_CURRENCY;
};

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(getStoredCurrency);

  const setCurrency = useCallback((nextCurrency) => {
    const safeCurrency = currencyByCode[nextCurrency] ? nextCurrency : BASE_CURRENCY;
    setCurrencyState(safeCurrency);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, safeCurrency);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === CURRENCY_STORAGE_KEY && currencyByCode[event.newValue]) {
        setCurrencyState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const selectedCurrency = currencyByCode[currency] || currencyByCode[BASE_CURRENCY];
  const rate = selectedCurrency.rateFromChf;
  const symbol = selectedCurrency.symbol;

  const convertFromChf = useCallback(
    (amount) => {
      const number = Number(amount);
      return Number.isFinite(number) ? number * rate : 0;
    },
    [rate]
  );

  const formatPrice = useCallback(
    (amount, options = {}) => {
      const converted = convertFromChf(amount);
      const decimals = options.decimals ?? 2;
      const value = converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return selectedCurrency.code === "CHF"
        ? `${selectedCurrency.symbol}${value}`
        : `${selectedCurrency.symbol}${value}`;
    },
    [convertFromChf, selectedCurrency]
  );

  const value = useMemo(
    () => ({
      currency,
      selectedCurrency,
      setCurrency,
      rate,
      symbol,
      convertFromChf,
      formatPrice,
      SUPPORTED_CURRENCIES,
      baseCurrency: BASE_CURRENCY,
    }),
    [currency, selectedCurrency, setCurrency, rate, symbol, convertFromChf, formatPrice]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
