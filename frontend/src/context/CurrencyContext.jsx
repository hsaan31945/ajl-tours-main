import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../utils/api";

export const BASE_CURRENCY = "CHF";
export const CURRENCY_STORAGE_KEY = "ajl:selectedCurrency";
const RATES_STORAGE_KEY = "ajl:latestExchangeRates";

export const SUPPORTED_CURRENCIES = [
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
  },
  {
    code: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
  },
  {
    code: "CLP",
    name: "Chilean Peso",
    symbol: "CL$",
  },
  {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "RMB¥",
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
  },
  {
    code: "COP",
    name: "Colombian Peso",
    symbol: "COL$",
  },
  {
    code: "CZK",
    name: "Czech Koruna",
    symbol: "Kč",
  },
  {
    code: "DKK",
    name: "Danish Krone",
    symbol: "DKK",
  },
  {
    code: "EGP",
    name: "Egyptian Pound",
    symbol: "E£",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
  },
  {
    code: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
  },
  {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
  },
  {
    code: "ILS",
    name: "Israeli New Shekel",
    symbol: "₪",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
  },
  {
    code: "MXN",
    name: "Mexican Peso",
    symbol: "MXN",
  },
  {
    code: "MAD",
    name: "Moroccan Dirham",
    symbol: "د.م",
  },
  {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
  },
  {
    code: "NOK",
    name: "Norwegian Krone",
    symbol: "NOK",
  },
  {
    code: "PHP",
    name: "Philippine Peso",
    symbol: "₱",
  },
  {
    code: "PLN",
    name: "Polish Złoty",
    symbol: "zł",
  },
  {
    code: "RON",
    name: "Romanian Leu",
    symbol: "lei",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
  },
  {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
  },
  {
    code: "KRW",
    name: "South Korean Won",
    symbol: "₩",
  },
  {
    code: "SEK",
    name: "Swedish Krona",
    symbol: "SEK",
  },
  {
    code: "THB",
    name: "Thai Baht",
    symbol: "฿",
  },
  {
    code: "TRY",
    name: "Turkish Lira",
    symbol: "₺",
  },
  {
    code: "USD",
    name: "U.S. Dollar",
    symbol: "$",
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
  },
  {
    code: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
  },
  {
    code: "UYU",
    name: "Uruguayan Peso",
    symbol: "$U",
  },
  {
    code: "VND",
    name: "Vietnamese Dong",
    symbol: "₫",
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

const getStoredRates = () => {
  if (typeof window === "undefined") return { [BASE_CURRENCY]: 1 };
  try {
    const payload = JSON.parse(window.localStorage.getItem(RATES_STORAGE_KEY) || "{}");
    return {
      [BASE_CURRENCY]: 1,
      ...(payload?.rates && typeof payload.rates === "object" ? payload.rates : {}),
    };
  } catch {
    return { [BASE_CURRENCY]: 1 };
  }
};

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(getStoredCurrency);
  const [exchangeRates, setExchangeRates] = useState(getStoredRates);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState("");
  const [ratesStale, setRatesStale] = useState(false);
  const [ratesFetchedAt, setRatesFetchedAt] = useState(null);

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
      } else if (event.key === RATES_STORAGE_KEY) {
        setExchangeRates(getStoredRates());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadRates = async () => {
      setRatesLoading(true);
      setRatesError("");
      try {
        const response = await fetch(apiUrl("/api/exchange-rates"), {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Exchange rates unavailable (${response.status})`);
        }

        const payload = await response.json();
        const rates = {
          [BASE_CURRENCY]: 1,
          ...(payload?.rates && typeof payload.rates === "object" ? payload.rates : {}),
        };

        setExchangeRates(rates);
        setRatesStale(Boolean(payload?.stale));
        setRatesFetchedAt(payload?.fetchedAt || null);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify({
            rates,
            fetchedAt: payload?.fetchedAt || new Date().toISOString(),
          }));
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        setExchangeRates(getStoredRates());
        setRatesStale(true);
        setRatesError(error.message || "Exchange rates unavailable");
      } finally {
        setRatesLoading(false);
      }
    };

    loadRates();
    return () => controller.abort();
  }, []);

  const selectedCurrencyBase = currencyByCode[currency] || currencyByCode[BASE_CURRENCY];
  const rate = Number(exchangeRates[currency]) || (currency === BASE_CURRENCY ? 1 : 1);
  const selectedCurrency = {
    ...selectedCurrencyBase,
    rateFromChf: rate,
  };
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
      ratesLoading,
      ratesError,
      ratesStale,
      ratesFetchedAt,
      hasLiveRate: Boolean(exchangeRates[currency]),
    }),
    [currency, selectedCurrency, setCurrency, rate, symbol, convertFromChf, formatPrice, ratesLoading, ratesError, ratesStale, ratesFetchedAt, exchangeRates]
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
