import apiClient from "../api/client";
import { parseUserAgent, getLocationHints } from "./device";

let inFlight = false;
let lastPathname = null;
let suppressedUntil = 0;
let backoffMs = 0;
const BASE_BACKOFF = 2000; // start with 2s
const MAX_BACKOFF = 60000; // cap at 60s
let pageViewTimer = null;
let lastErrorLoggedAt = 0;

/**
 * PUBLIC_INTERFACE
 * postActivity sends an activity event to the backend with the required schema.
 * Payload format:
 * { type: 'page_view'|'login'|'session_start'|'session_end',
 *   metadata: { path, referrer, device: { ua, os, browser }, location?: { country, region, city, ip } } }
 */
export async function postActivity(payload) {
  const now = Date.now();
  if (now < suppressedUntil) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[activity] Suppressed due to backoff window.");
    }
    return;
  }

  if (inFlight) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] Skipping because a request is in-flight.");
    }
    return;
  }

  try {
    inFlight = true;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] 📤 Posting activity:", payload.type, payload?.metadata?.path);
    }
    // apiClient has baseURL '/api' or REACT_APP_API_URL
    const response = await apiClient.post("/activities/track", payload);
    // Reset backoff on success
    backoffMs = 0;
    lastErrorLoggedAt = 0;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] ✓ Activity posted:", response.status);
    }
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    // Exponential backoff after server or auth errors
    if (status === 401 || status >= 500 || !status) {
      backoffMs = backoffMs ? Math.min(backoffMs * 2, MAX_BACKOFF) : BASE_BACKOFF;
      suppressedUntil = Date.now() + backoffMs;
    }
    if (process.env.NODE_ENV !== "production") {
      // Log the exact response body once during a backoff cycle for diagnosis
      const shouldLogBody = !lastErrorLoggedAt || (Date.now() - lastErrorLoggedAt > MAX_BACKOFF);
      if (shouldLogBody) {
        lastErrorLoggedAt = Date.now();
        // eslint-disable-next-line no-console
        console.error(
          "[activity] ✗ Failed to post activity:",
          status,
          body || err?.message || err
        );
      }
    }
  } finally {
    inFlight = false;
  }
}

/**
 * PUBLIC_INTERFACE
 * buildMetadata constructs the metadata object for activity tracking.
 */
export function buildMetadata(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
  const referrer = (typeof document !== 'undefined' ? document.referrer : '') || null;
  const deviceParsed = parseUserAgent(typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const { ua, os, browser } = deviceParsed;
  const location = getLocationHints();
  return {
    path: pathname,
    referrer,
    device: { ua, os, browser },
    location,
  };
}

/**
 * PUBLIC_INTERFACE
 * trackPageView posts a page_view activity for the given path with debounce and route guard.
 */
export function trackPageView(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
  if (lastPathname === pathname) {
    // only track on actual route changes
    return;
  }
  lastPathname = pathname;

  if (pageViewTimer) clearTimeout(pageViewTimer);
  pageViewTimer = setTimeout(() => {
    const metadata = buildMetadata(pathname);
    postActivity({
      type: "page_view",
      metadata,
    });
  }, 250);
}

/**
 * PUBLIC_INTERFACE
 * trackSessionStart posts a session_start activity.
 */
export function trackSessionStart() {
  const metadata = buildMetadata();
  postActivity({
    type: "session_start",
    metadata,
  });
}

/**
 * PUBLIC_INTERFACE
 * trackSessionEnd posts a session_end activity.
 */
export function trackSessionEnd() {
  const metadata = buildMetadata();
  postActivity({
    type: "session_end",
    metadata,
  });
}

/**
 * PUBLIC_INTERFACE
 * trackLogin posts a login activity.
 */
export function trackLogin() {
  const metadata = buildMetadata();
  postActivity({
    type: "login",
    metadata,
  });
}
