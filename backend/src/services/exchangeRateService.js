const axios = require('axios');
const ExchangeRate = require('../../models/ExchangeRate');

const BASE_CURRENCY = 'CHF';
const CACHE_TTL_MS = Number(process.env.EXCHANGE_RATE_CACHE_HOURS || 24) * 60 * 60 * 1000;
const PROVIDER_NAME = 'open-er-api';
const DEFAULT_SYMBOLS = [
  'AUD', 'BRL', 'GBP', 'CAD', 'CLP', 'CNY', 'COP', 'CZK', 'DKK', 'EGP',
  'EUR', 'HKD', 'HUF', 'INR', 'IDR', 'ILS', 'JPY', 'MYR', 'MXN', 'MAD',
  'NZD', 'NOK', 'PHP', 'PLN', 'RON', 'SGD', 'ZAR', 'KRW', 'SEK', 'THB',
  'TRY', 'USD', 'AED', 'UAH', 'UYU', 'VND',
];

let memoryCache = null;

const normalizeRateMap = (rates = {}) => {
  const normalized = { [BASE_CURRENCY]: 1 };
  for (const [code, rate] of Object.entries(rates || {})) {
    const currencyCode = String(code || '').trim().toUpperCase();
    const numericRate = Number(rate);
    if (currencyCode && Number.isFinite(numericRate) && numericRate > 0) {
      normalized[currencyCode] = numericRate;
    }
  }
  return normalized;
};

const buildPayload = ({ rates, provider = PROVIDER_NAME, fetchedAt = new Date(), stale = false, error = '' }) => ({
  base: BASE_CURRENCY,
  rates: normalizeRateMap(rates),
  provider,
  fetchedAt: new Date(fetchedAt).toISOString(),
  stale,
  error,
  cacheTtlHours: Math.round(CACHE_TTL_MS / (60 * 60 * 1000)),
});

const isFresh = (payload) => (
  payload?.fetchedAt && Date.now() - new Date(payload.fetchedAt).getTime() < CACHE_TTL_MS
);

const saveLatestRates = async (payload) => {
  await ExchangeRate.findOneAndUpdate(
    { base: BASE_CURRENCY },
    {
      base: BASE_CURRENCY,
      rates: payload.rates,
      provider: payload.provider,
      fetchedAt: new Date(payload.fetchedAt),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getStoredRates = async () => {
  const stored = await ExchangeRate.findOne({ base: BASE_CURRENCY }).lean();
  if (!stored?.rates) return null;

  const rates = stored.rates instanceof Map
    ? Object.fromEntries(stored.rates)
    : stored.rates;

  return buildPayload({
    rates,
    provider: stored.provider || 'stored',
    fetchedAt: stored.fetchedAt || stored.updatedAt || new Date(),
    stale: true,
  });
};

const fetchProviderRates = async () => {
  const providerUrl = process.env.EXCHANGE_RATE_API_URL ||
    `https://open.er-api.com/v6/latest/${BASE_CURRENCY}`;

  const response = await axios.get(providerUrl, {
    timeout: Number(process.env.EXCHANGE_RATE_TIMEOUT_MS || 8000),
    headers: { Accept: 'application/json' },
  });

  const data = response.data || {};
  const providerRates = data.rates || data.conversion_rates || data.data || {};
  const rates = DEFAULT_SYMBOLS.reduce((acc, code) => {
    if (providerRates[code] != null) acc[code] = providerRates[code];
    return acc;
  }, {});

  return buildPayload({
    rates,
    provider: process.env.EXCHANGE_RATE_PROVIDER || PROVIDER_NAME,
    fetchedAt: data.time_last_update_unix
      ? new Date(Number(data.time_last_update_unix) * 1000)
      : (data.date ? new Date(`${data.date}T00:00:00.000Z`) : new Date()),
  });
};

const getExchangeRates = async ({ forceRefresh = false } = {}) => {
  if (!forceRefresh && memoryCache && isFresh(memoryCache)) {
    return memoryCache;
  }

  const stored = await getStoredRates().catch(() => null);
  if (!forceRefresh && stored && isFresh(stored)) {
    memoryCache = { ...stored, stale: false };
    return memoryCache;
  }

  try {
    const fresh = await fetchProviderRates();
    memoryCache = fresh;
    await saveLatestRates(fresh);
    return fresh;
  } catch (error) {
    if (memoryCache?.rates) {
      return { ...memoryCache, stale: true, error: error.message };
    }
    if (stored?.rates) {
      return { ...stored, stale: true, error: error.message };
    }

    return buildPayload({
      rates: { [BASE_CURRENCY]: 1 },
      provider: 'fallback',
      fetchedAt: new Date(),
      stale: true,
      error: error.message || 'Exchange-rate provider failed',
    });
  }
};

module.exports = {
  BASE_CURRENCY,
  DEFAULT_SYMBOLS,
  getExchangeRates,
};
