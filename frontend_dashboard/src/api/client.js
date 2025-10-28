import axios from "axios";
import { getClerkTokenProvider } from "../context/AuthContext";

/**
 * API base URL
 * Default: same-origin using relative '/api' so cookies/headers work without CORS.
 * In development, CRA dev server will proxy '/api' and '/socket.io' to http://localhost:4000 (see package.json "proxy").
 * Override for split-host dev by setting REACT_APP_API_URL (e.g. http://localhost:4000) if you don't want to rely on proxy.
 */
const API_BASE =
  (process.env.REACT_APP_API_URL && `${process.env.REACT_APP_API_URL}/api`) ||
  "/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Attach Clerk token on each request
api.interceptors.request.use(async (config) => {
  const getToken = getClerkTokenProvider();
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore token errors; request will likely 401
    }
  }
  return config;
});

// Handle 401 by redirecting to Clerk sign-in
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      if (!window.location.pathname.startsWith("/sign-in")) {
        window.location.replace("/sign-in");
      }
    }
    return Promise.reject(error);
  }
);

// PUBLIC_INTERFACE
export function setAuthToken(_token) {
  /** Deprecated: token is managed by Clerk now. No-op kept for compatibility. */
}
