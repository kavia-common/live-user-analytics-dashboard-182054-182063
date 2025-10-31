import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * PUBLIC_INTERFACE
 * getApiBaseUrl resolves the API base URL from env with sane defaults.
 */
export function getApiBaseUrl() {
  const base = API_URL && String(API_URL).trim().length ? API_URL : '';
  const normalized = base ? base.replace(/\/*$/, '') : '';
  return normalized ? `${normalized}/api` : '/api';
}

// Token provider function to be injected by AuthContext to keep token fresh
let authTokenProvider = null;

// PUBLIC_INTERFACE
export function setAuthTokenProvider(providerFn) {
  authTokenProvider = providerFn;
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
});

// Request interceptor to inject Authorization header with Clerk token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (authTokenProvider) {
        const token = await authTokenProvider();
        if (token) {
          // eslint-disable-next-line no-param-reassign
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore token errors for request and proceed without Authorization
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Basic response handling; allow caller to handle 401/403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default apiClient;
