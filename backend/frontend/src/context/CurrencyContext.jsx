import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const BASE_CURRENCY = "CHF";
export const CURRENCY_STORAGE_KEY = "ajl:selectedCurrency";

export const SUPPORTED_CURRENCIES = [
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    rateFromChf: 1.813706,
  },
  {
    code: "BRL",
    name: "Brazilian Real",
    symbol: "R$",
    rateFromChf: 6.44839,
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    rateFromChf: 0.946783,
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    rateFromChf: 1.741266,
  },
  {
    code: "CLP",
    name: "Chilean Peso",
    symbol: "CL$",
    rateFromChf: 1149.785869,
  },
  {
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "RMB¥",
    rateFromChf: 8.607276,
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
    rateFromChf: 1,
  },
  {
    code: "COP",
    name: "Colombian Peso",
    symbol: "COL$",
    rateFromChf: 4580.909246,
  },
  {
    code: "CZK",
    name: "Czech Koruna",
    symbol: "Kč",
    rateFromChf: 26.600382,
  },
  {
    code: "DKK",
    name: "Danish Krone",
    symbol: "DKK",
    rateFromChf: 8.092239,
  },
  {
    code: "EGP",
    name: "Egyptian Pound",
    symbol: "E£",
    rateFromChf: 67.995859,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rateFromChf: 1.084695,
  },
  {
    code: "HKD",
    name: "Hong Kong Dollar",
    symbol: "HK$",
    rateFromChf: 9.789204,
  },
  {
    code: "HUF",
    name: "Hungarian Forint",
    symbol: "Ft",
    rateFromChf: 417.271276,
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
    rateFromChf: 115.803,
  },
  {
    code: "IDR",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    rateFromChf: 21290.602668,
  },
  {
    code: "ILS",
    name: "Israeli New Shekel",
    symbol: "₪",
    rateFromChf: 3.912056,
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    rateFromChf: 199.495165,
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    rateFromChf: 5.037788,
  },
  {
    code: "MXN",
    name: "Mexican Peso",
    symbol: "MXN",
    rateFromChf: 22.343128,
  },
  {
    code: "MAD",
    name: "Moroccan Dirham",
    symbol: "د.م",
    rateFromChf: 11.740208,
  },
  {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    rateFromChf: 2.194953,
  },
  {
    code: "NOK",
    name: "Norwegian Krone",
    symbol: "NOK",
    rateFromChf: 12.210231,
  },
  {
    code: "PHP",
    name: "Philippine Peso",
    symbol: "₱",
    rateFromChf: 75.273639,
  },
  {
    code: "PLN",
    name: "Polish Złoty",
    symbol: "zł",
    rateFromChf: 4.640476,
  },
  {
    code: "RON",
    name: "Romanian Leu",
    symbol: "lei",
    rateFromChf: 5.533792,
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    rateFromChf: 1.608003,
  },
  {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    rateFromChf: 21.205672,
  },
  {
    code: "KRW",
    name: "South Korean Won",
    symbol: "₩",
    rateFromChf: 1890.420266,
  },
  {
    code: "SEK",
    name: "Swedish Krona",
    symbol: "SEK",
    rateFromChf: 11.836578,
  },
  {
    code: "THB",
    name: "Thai Baht",
    symbol: "฿",
    rateFromChf: 40.807257,
  },
  {
    code: "TRY",
    name: "Turkish Lira",
    symbol: "₺",
    rateFromChf: 55.688154,
  },
  {
    code: "USD",
    name: "U.S. Dollar",
    symbol: "$",
    rateFromChf: 1.249141,
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    rateFromChf: 4.587465,
  },
  {
    code: "UAH",
    name: "Ukrainian Hryvnia",
    symbol: "₴",
    rateFromChf: 54.682091,
  },
  {
    code: "UYU",
    name: "Uruguayan Peso",
    symbol: "$U",
    rateFromChf: 50.627151,
  },
  {
    code: "VND",
    name: "Vietnamese Dong",
    symbol: "₫",
    rateFromChf: 32786.405804,
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
