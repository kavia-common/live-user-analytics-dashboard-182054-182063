import axios from "axios";
import { getClerkTokenProvider } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * getApiBaseUrl resolves the API base URL from environment with sane defaults.
 */
export function getApiBaseUrl() {
  // Prefer explicit envs; standardized CRA-style variable
  const direct = process.env.REACT_APP_API_URL;
  // Fallback to same-origin via CRA proxy in dev
  const base = direct && String(direct).trim().length ? direct : "";
  const normalized = base ? base.replace(/\/*$/, "") : "";
  return normalized ? `${normalized}/api` : "/api";
}

/**
 * Maintains a global signal when client-side blocking is detected, to show a banner.
 */
let blockedByClient = false;
// PUBLIC_INTERFACE
export function wasBlockedByClient() {
  return blockedByClient;
}

/**
 * In dev, when requests are blocked by client (ad blocker) or Clerk token unavailable, we optionally return mock data.
 */
function devMockResponse(config) {
  if (process.env.NODE_ENV === "production") return null;
  const url = String(config?.url || "");
  if (url.includes("/stats/overview")) {
    return {
      data: { activeSessions: 3, eventsCount: 42, uniqueUsers: 2, windowMinutes: 60 },
      status: 200,
      headers: {},
      config,
    };
  }
  if (url.includes("/stats/timeseries")) {
    const now = Date.now();
    const series = Array.from({ length: 12 }).map((_, i) => ({
      ts: new Date(now - (11 - i) * 5 * 60 * 1000).toISOString(),
      count: Math.floor(5 + Math.random() * 15),
    }));
    return { data: { series }, status: 200, headers: {}, config };
  }
  if (url.includes("/stats/devices")) {
    return {
      data: {
        devices: [
          { deviceType: "desktop", browser: "Chrome", count: 24 },
          { deviceType: "mobile", browser: "Safari", count: 12 },
        ],
      },
      status: 200,
      headers: {},
      config,
    };
  }
  if (url.includes("/stats/locations")) {
    return {
      data: { locations: [{ country: "US", count: 20 }, { country: "DE", count: 8 }, { country: "IN", count: 6 }] },
      status: 200,
      headers: {},
      config,
    };
  }
  if (url.includes("/activities/recent")) {
    return { data: { items: [] }, status: 200, headers: {}, config };
  }
  if (url.includes("/auth/me")) {
    return { data: { user: { id: "dev", email: "dev@example.com", role: "admin" } }, status: 200, headers: {}, config };
  }
  return null;
}

const API_BASE = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Attach Clerk token on each request; in dev, if Clerk is misconfigured, proceed unauthenticated
api.interceptors.request.use(async (config) => {
  const getToken = getClerkTokenProvider();
  config.headers = config.headers || {};
  if (getToken) {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // eslint-disable-next-line no-console
        console.debug("[api] Attached Authorization header to", config.url);
      } else {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.debug("[api] No token; continuing unauthenticated (dev)");
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.debug("[api] getToken error; continuing unauthenticated (dev)", e);
      }
    }
  }
  return config;
});

// Response interceptor: handle client-blocked requests, retry with '/analytics' path if '/stats' is blocked, or return dev mocks
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const isBlocked = String(error?.message || "").includes("ERR_BLOCKED_BY_CLIENT");
    const status = error?.response?.status;
    const original = error?.config || {};
    const url = String(original.url || "");

    // If blocked (likely by ad blocker) mark and try a path alias: replace '/stats' with '/analytics'
    if (isBlocked || status === 0) {
      blockedByClient = true;
      // eslint-disable-next-line no-console
      console.warn("[api] Request blocked by client/ad-blocker:", url);

      if (url.includes("/stats/")) {
        const altUrl = url.replace("/stats/", "/analytics/");
        try {
          const retry = await api.request({ ...original, url: altUrl });
          return retry;
        } catch (e2) {
          // fall through to possible mock in dev
        }
      }

      const mock = devMockResponse(original);
      if (mock) return Promise.resolve(mock);
    }

    // If Clerk-protected endpoints 401 and we're in dev, use mock
    if (status === 401 && process.env.NODE_ENV !== "production") {
      const mock = devMockResponse(original);
      if (mock) return Promise.resolve(mock);
    }

    // If /auth/me fails, allow dev continuation
    if (url.includes("/auth/me") && (status === 404 || status === 401)) {
      if (process.env.NODE_ENV !== "production") {
        return Promise.resolve({
          data: { user: { id: "dev", email: "dev@example.com", role: "user" } },
          status: 200,
          headers: {},
          config: original,
        });
      }
    }

    // Default handling: if 401 and not on auth pages, redirect to sign-in
    if (status === 401) {
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
