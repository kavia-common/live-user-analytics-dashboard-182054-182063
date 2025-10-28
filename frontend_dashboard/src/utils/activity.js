import { api } from "../api/client";

/**
 * PUBLIC_INTERFACE
 * postActivity sends an activity event to the backend.
 * @param {Object} payload - Activity event payload
 * @param {string} payload.type - Event type: login, logout, page_view, click, navigation
 * @param {string} [payload.page] - Page path
 * @param {Object} [payload.device] - Device info (os, browser, deviceType)
 * @param {Object} [payload.location] - Location info (country, region, city)
 * @param {Object} [payload.metadata] - Additional metadata
 */
export async function postActivity(payload) {
  try {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] 📤 Posting activity:", payload.type, payload.page);
    }
    const response = await api.post("/activities", payload);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[activity] ✓ Activity posted:", response.status);
    }
  } catch (err) {
    // Silently fail in production; log in dev
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[activity] ✗ Failed to post activity:", err?.response?.status, err?.response?.data?.error || err?.message);
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * detectDevice returns basic device information from user agent.
 */
export function detectDevice() {
  const ua = navigator.userAgent || "";
  let os = "Unknown";
  let browser = "Unknown";
  let deviceType = "desktop";

  // Detect OS
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iOS|iPhone|iPad|iPod/i.test(ua)) os = "iOS";

  // Detect Browser
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";

  // Detect Device Type
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    deviceType = /iPad/i.test(ua) ? "tablet" : "mobile";
  }

  return { os, browser, deviceType };
}

/**
 * PUBLIC_INTERFACE
 * trackPageView posts a page_view activity for the current page.
 */
export function trackPageView(page = window.location.pathname) {
  const device = detectDevice();
  postActivity({
    type: "page_view",
    page,
    device,
    metadata: { referrer: document.referrer || null },
  });
}

/**
 * PUBLIC_INTERFACE
 * trackLogin posts a login activity.
 */
export function trackLogin() {
  const device = detectDevice();
  postActivity({
    type: "login",
    page: window.location.pathname,
    device,
  });
}

/**
 * PUBLIC_INTERFACE
 * trackClick posts a click activity with optional metadata.
 */
export function trackClick(metadata = {}) {
  const device = detectDevice();
  postActivity({
    type: "click",
    page: window.location.pathname,
    device,
    metadata,
  });
}
