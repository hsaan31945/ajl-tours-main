import { apiUrl } from "../utils/api";
import { cleanDisplayName } from "../utils/textFormatting";

const cache = new Map();
const inFlightRequests = new Map();
const CACHE_MS = 5 * 60 * 1000;
const STALE_CACHE_MS = 30 * 60 * 1000;

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  qs.set('view', params.view || 'list');
  if (params.division) qs.set('division', params.division);
  if (params.limit != null) qs.set('limit', String(params.limit));
  if (params.sort) qs.set('sort', params.sort);
  if (params.full) qs.set('full', 'true');
  return qs.toString();
}

export async function fetchToursList(params = {}, options = {}) {
  const key = buildQuery(params);
  const hit = cache.get(key);
  if (!options.skipCache && hit && hit.expires > Date.now()) {
    return hit.data;
  }

  if (!options.skipCache && inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs || 30000)
    : null;

  const request = (async () => {
    const res = await fetch(apiUrl(`/api/tours?${key}`), {
      signal,
      headers: {
        'Cache-Control': options.skipCache ? 'no-cache' : 'public, max-age=300',
      },
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
    return await request;
  } catch (error) {
    if (!options.skipCache && hit && hit.staleUntil > Date.now()) {
      return hit.data;
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
