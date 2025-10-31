import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * api client
 * Axios instance pointing to backend API. Includes credentials and JSON headers.
 */
const RAW_API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_frontend_dashboard__REACT_APP_API_URL ||
  "/api";

// Normalize base URL to avoid double slashes and double '/api'
const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "") || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
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

// PUBLIC_INTERFACE
// apiFetch helper with credentials and JSON handling
export async function apiFetch(path, options = {}) {
  const base = API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalizedPath}`;
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
