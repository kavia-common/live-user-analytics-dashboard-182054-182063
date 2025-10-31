const fallbackApi =
  process.env.REACT_APP_frontend_dashboard?.REACT_APP_API_URL ||
  process.env.REACT_APP_API_URL ||
  '';

export const API_BASE_URL = fallbackApi;

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
  if (!API_BASE_URL) {
    console.warn('API_BASE_URL is not set. Using mock/fallback data.');
    throw new Error('API base URL not set');
  }
  const url = `${API_BASE_URL}${path}`;
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
