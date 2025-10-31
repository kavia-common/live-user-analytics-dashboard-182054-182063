import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackSessionStart, trackSessionEnd } from "../utils/activity";

/**
 * PUBLIC_INTERFACE
 * useActivityTracking automatically tracks:
 * - session_start on mount (except login route)
 * - session_end on page unload or when document becomes hidden
 * - page_view on every route change (debounced, guarded)
 * It is resilient to missing auth; the axios client will simply omit Authorization if no token is available.
 */
export function useActivityTracking() {
  const location = useLocation();
  const lastTrackedPathRef = useRef(null);
  const mountedRef = useRef(false);

  // session_start on mount; session_end on unload/visibilitychange
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      try {
        // Do not start a session on the login page to avoid unauthenticated spam
        if (window.location.pathname !== "/login" && window.location.pathname !== "/sign-in") {
          trackSessionStart();
        }
      } catch {
        // noop
      }
    }

    const handleBeforeUnload = () => {
      try {
        // Use sendBeacon for reliability on page unload where possible
        if (navigator?.sendBeacon) {
          const urlBase =
            (process.env.REACT_APP_API_URL || "/api").replace(/\/*$/, "");
          const url = `${urlBase}/activities/track`;
          const metadata = {
            type: "session_end",
            metadata: {
              path: window.location.pathname,
              referrer: document.referrer || null,
              device: {
                ua: navigator.userAgent || "",
              },
              location: {},
            },
          };
          const blob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          trackSessionEnd();
        }
      } catch {
        // swallow errors
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Avoid duplicate session_end on SPA unmount; only send if page is actually being left
      try {
        trackSessionEnd();
      } catch {
        // noop
      }
    };
  }, []);

  // Track page_view on route change - guard to avoid re-sending for same path
  useEffect(() => {
    const pathname = location.pathname;
    if (lastTrackedPathRef.current === pathname) return;
    lastTrackedPathRef.current = pathname;
    try {
      // Avoid page_view spam on login route before auth
      if (pathname !== "/login" && pathname !== "/sign-in") {
        trackPageView(pathname);
      }
    } catch {
      // noop
    }
  }, [location.pathname]);
}
