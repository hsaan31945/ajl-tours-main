const PRODUCTION_API_URL = 'https://ajl-tours-backend-phi.vercel.app';

const isLocalDevUrl = (url) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url || '');

/**
 * Backend base URL for API calls.
 * - Production builds always use the live Vercel backend (never localhost from .env).
 * - Local dev uses VITE_API_URL or same-origin + Vite proxy when empty.
 */
export const getBackendUrl = () => {
  const configured =
    import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;

  if (import.meta.env.PROD) {
    return configured && !isLocalDevUrl(configured)
      ? configured.replace(/\/$/, '')
      : PRODUCTION_API_URL;
  }

  if (configured && !isLocalDevUrl(configured)) {
    return configured.replace(/\/$/, '');
  }
  if (configured && isLocalDevUrl(configured)) {
    return configured.replace(/\/$/, '');
  }
  return '';
};

export const apiUrl = (path) => {
  const base = getBackendUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
};
