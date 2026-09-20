function resolveApiUrl() {
  const raw = (process.env.REACT_APP_API_URL || '').trim().replace(/\/$/, '');
  if (!raw) return '/api';
  // Absolute http(s) API host
  if (/^https?:\/\//i.test(raw)) return raw;
  // Relative path like /api
  if (raw.startsWith('/')) return raw;
  // Misconfigured env (e.g. DATABASE_URL pasted into REACT_APP_API_URL)
  // eslint-disable-next-line no-console
  console.warn('Ignoring invalid REACT_APP_API_URL (must be http(s) URL or /api path)');
  return '/api';
}

/** Absolute or relative API root ending without trailing slash, e.g. https://api.example.com/api or /api */
export const API_URL = resolveApiUrl();

export default API_URL;
