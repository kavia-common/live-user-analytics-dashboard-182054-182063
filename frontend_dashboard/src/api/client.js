import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * apiClient
 * Axios instance pointing to backend API. Includes credentials and, if a Clerk token is available on window,
 * attaches it as Authorization header.
 */
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_frontend_dashboard__REACT_APP_API_URL ||
  "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

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
    } catch (e) {
      // ignore token fetch failures
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * PUBLIC_INTERFACE
 * apiFetch
 * Fetch helper that adds Clerk Bearer token if available and handles JSON bodies.
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const defaultHeaders = { "Content-Type": "application/json" };

  let authHeaders = {};
  try {
    const clerk = (typeof window !== "undefined" && (window.Clerk || window.clerk)) || null;
    const session = clerk && clerk.session;
    if (session && typeof session.getToken === "function") {
      const token = await session.getToken({ template: "default" }).catch(() => null);
      if (token) authHeaders = { Authorization: `Bearer ${token}` };
    }
  } catch {
    // graceful fallback without auth
  }

  const resp = await fetch(url, {
    method: options.method || "GET",
    ...options,
    headers: {
      ...defaultHeaders,
      ...authHeaders,
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
