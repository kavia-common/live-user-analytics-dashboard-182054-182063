import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * api client
 * Axios instance pointing to backend API. Includes credentials and JSON headers.
 */
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_frontend_dashboard__REACT_APP_API_URL ||
  "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Keep a lightweight interceptor (optional if Clerk session available globally)
api.interceptors.request.use(
  async (config) => {
    // If you need to attach a Bearer token, do it here.
    return config;
  },
  (error) => Promise.reject(error)
);

// PUBLIC_INTERFACE
// apiFetch helper with credentials and JSON handling
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
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
