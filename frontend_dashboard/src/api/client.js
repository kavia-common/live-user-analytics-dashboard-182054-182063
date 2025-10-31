import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * api client
 * Axios instance configured for SAME-ORIGIN by default.
 *
 * Defaults:
 *  - baseURL = '' so calls like api.get('/api/users') go to the current origin.
 * Overrides:
 *  - REACT_APP_API_URL can be set to a full URL (e.g., https://api.example.com or https://api.example.com/api)
 * Notes:
 *  - Do not append '/api' here. Use '/api/...' in call sites to avoid double-prefix issues.
 */
const RAW_API_URL = (process.env.REACT_APP_API_URL || "").trim();

// Normalize override; if not provided, use same-origin by leaving baseURL as ''
let baseURL = RAW_API_URL || "";

// Remove trailing slash(es) to avoid '//' when joining
if (baseURL.endsWith("/")) {
  baseURL = baseURL.replace(/\/+$/, "");
}

const api = axios.create({
  baseURL, // '' for same-origin, or override from REACT_APP_API_URL
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Clerk token if available, but only when present
api.interceptors.request.use(
  async (config) => {
    try {
      const clerk = (typeof window !== "undefined" && (window.Clerk || window.clerk)) || null;
      const session = clerk && clerk.session;
      if (session && typeof session.getToken === "function") {
        const token = await session.getToken({ template: "default" }).catch(() => null);
        if (token) {
          config.headers = {
            ...(config.headers || {}),
            Authorization: `Bearer ${token}`,
          };
        }
      }
    } catch {
      // ignore token retrieval errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * PUBLIC_INTERFACE
 * apiFetch helper with credentials and JSON handling using same-origin default.
 * Use with path starting with '/api/...'
 */
export async function apiFetch(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseURL}${normalizedPath}`;
  const resp = await fetch(url, {
    method: options.method || "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
    credentials: "include",
  });

  if (!resp.ok) {
    let message = `API error: ${resp.status}`;
    try {
      const text = await resp.text();
      message = text || message;
    } catch {}
    throw new Error(message);
  }
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp.text();
}

export default api;
