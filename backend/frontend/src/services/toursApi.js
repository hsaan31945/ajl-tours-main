import { apiUrl } from "../utils/api";

const cache = new Map();
const CACHE_MS = 60 * 1000;

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

  const controller = options.signal ? null : new AbortController();
  const signal = options.signal || controller?.signal;
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs || 15000)
    : null;

  try {
    const res = await fetch(apiUrl(`/api/tours?${key}`), {
      signal,
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) throw new Error(`Failed to load tours (${res.status})`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    cache.set(key, { data: list, expires: Date.now() + CACHE_MS });
    return list;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function clearToursCache() {
  cache.clear();
}
