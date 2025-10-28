import axios from "axios";

/**
 * API base URL
 * Default: same-origin using relative '/api' so cookies/headers work without CORS.
 * Override for split-host dev by setting REACT_APP_API_URL (e.g. http://localhost:4000).
 */
const API_BASE =
  (process.env.REACT_APP_API_URL && `${process.env.REACT_APP_API_URL}/api`) ||
  "/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      // If unauthorized, clear auth and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

// PUBLIC_INTERFACE
export function setAuthToken(token) {
  /** Sets the JWT token to be used by the API client. */
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}
