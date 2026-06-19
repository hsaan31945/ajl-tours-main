import { apiUrl } from "../utils/api";
import { cleanDisplayName } from "../utils/textFormatting";

const cache = new Map();
const inFlightRequests = new Map();
const CACHE_MS = 5 * 60 * 1000;
const STALE_CACHE_MS = 30 * 60 * 1000;

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  qs.set('view', 'list');
  if (params.division) qs.set('division', params.division);
  qs.set('limit', String(Math.max(100, Number(params.limit) || 100)));
  return qs.toString();
}

function applyClientView(list, params = {}) {
  const data = [...list];
  if (params.sort === 'popular') {
    data.sort((a, b) => {
      const reviewDelta = Number(b.reviewCount || b.reviews || 0) - Number(a.reviewCount || a.reviews || 0);
      if (reviewDelta) return reviewDelta;
      return Number(b.rating || 0) - Number(a.rating || 0);
    });
  }
  return data.slice(0, Math.max(1, Number(params.limit) || data.length));
}

export async function fetchToursList(params = {}, options = {}) {
  const key = buildQuery(params);
  const hit = cache.get(key);
  if (!options.skipCache && hit && hit.expires > Date.now()) {
    return applyClientView(hit.data, params);
  }

  if (!options.skipCache && inFlightRequests.has(key)) {
    return applyClientView(await inFlightRequests.get(key), params);
  }

  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs || 30000)
    : null;

  const request = (async () => {
    const res = await fetch(apiUrl(`/api/tours?${key}`), {
      signal,
      cache: 'default',
    });
    if (!res.ok) throw new Error(`Failed to load tours (${res.status})`);
    const data = await res.json();
    const list = Array.isArray(data)
      ? data.map((tour) => ({
          ...tour,
          name: cleanDisplayName(tour?.name || tour?.title || ''),
          title: cleanDisplayName(tour?.title || tour?.name || ''),
        }))
      : [];
    cache.set(key, {
      data: list,
      expires: Date.now() + CACHE_MS,
      staleUntil: Date.now() + STALE_CACHE_MS,
    });
    return list;
  })();

  if (!options.skipCache) {
    inFlightRequests.set(key, request);
  }

  try {
    return applyClientView(await request, params);
  } catch (error) {
    if (!options.skipCache && hit && hit.staleUntil > Date.now()) {
      return applyClientView(hit.data, params);
    }
    throw error;
  } finally {
    inFlightRequests.delete(key);
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function clearToursCache() {
  cache.clear();
}
