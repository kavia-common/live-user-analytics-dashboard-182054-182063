import axios from "axios";

/**
 * PUBLIC_INTERFACE
 * apiClient
 * Axios instance pointing to backend API. Includes credentials and, if a Clerk token is available on window,
 * attaches it as Authorization header.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  withCredentials: true,
});

api.interceptors.request.use(
  async (config) => {
    try {
      if (window && window.Clerk && window.Clerk.session) {
        const token = await window.Clerk.session.getToken({ template: "default" });
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

export default api;
