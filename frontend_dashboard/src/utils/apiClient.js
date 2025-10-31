/**
 * Resolve API base URL using CRA build-time env with safe runtime fallbacks.
 * Only access process.env.REACT_APP_* (replaced at build time). Never use bare `process`.
 */
const BUILD_API_URL =
  (process.env.REACT_APP_frontend_dashboard &&
    process.env.REACT_APP_frontend_dashboard.REACT_APP_API_URL) ||
  process.env.REACT_APP_API_URL ||
  '';

/**
 * Allow a runtime shim via window.__CONFIG__ if provided by hosting env.
 * Example: window.__CONFIG__ = { API_URL: 'https://api.example.com/api' }
 */
const RUNTIME_API_URL =
  (typeof window !== 'undefined' &&
    window.__CONFIG__ &&
    (window.__CONFIG__.REACT_APP_API_URL || window.__CONFIG__.API_URL)) ||
  '';

/**
 * Prefer build-time value, otherwise runtime value, else default to relative '/api'.
 * Trim trailing slashes to avoid '//' when joining paths.
 */
const resolved = (BUILD_API_URL || RUNTIME_API_URL || '/api').replace(/\/+$/, '');

export const API_BASE_URL = resolved;

function withTimeout(promise, ms = 4000) {
  let id;
  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => reject(new Error('Request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}

// PUBLIC_INTERFACE
export async function apiGet(path) {
  /** Perform GET to API_BASE_URL + path; throws on network but caller should catch and fallback */
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${suffix}`;
  const res = await withTimeout(fetch(url, { credentials: 'include' })).catch((e) => {
    console.warn('API fetch failed:', e?.message);
    throw e;
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
