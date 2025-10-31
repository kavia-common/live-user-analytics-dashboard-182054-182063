import apiClient from "../api/client";
import { parseUserAgent, getLocationHints } from "./device";

/**
 * PUBLIC_INTERFACE
 * postActivity sends an activity event to the backend with the required schema.
 * Payload format:
 * { type: 'page_view'|'login'|'session_start'|'session_end',
 *   metadata: { path, referrer, device: { ua, os, browser }, location?: { country, region, city, ip } } }
 */
export async function postActivity(payload) {
  try {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] 📤 Posting activity:", payload.type, payload?.metadata?.path);
    }
    // Send to unified tracking endpoint
    const response = await apiClient.post("/activities/track", payload);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] ✓ Activity posted:", response.status);
    }
  } catch (err) {
    // Silently fail in production; log in dev
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        "[activity] ✗ Failed to post activity:",
        err?.response?.status,
        err?.response?.data?.error || err?.message
      );
    }
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
 * trackPageView posts a page_view activity for the given path.
 */
export function trackPageView(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/')) {
  const metadata = buildMetadata(pathname);
  postActivity({
    type: "page_view",
    metadata,
  });
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
