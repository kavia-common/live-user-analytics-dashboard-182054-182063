import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, trackSessionStart, trackSessionEnd } from "../utils/activity";

/**
 * PUBLIC_INTERFACE
 * useActivityTracking automatically tracks:
 * - session_start on mount
 * - session_end on page unload or when document becomes hidden
 * - page_view on every route change
 * It is resilient to missing auth; the axios client will simply omit Authorization if no token is available.
 */
export function useActivityTracking() {
  const location = useLocation();

  // session_start on mount; session_end on unload/visibilitychange
  useEffect(() => {
    // Fire session_start once per mount
    try {
      trackSessionStart();
    } catch {
      // noop
    }

    const handleBeforeUnload = () => {
      try {
        // Use sendBeacon for reliability on page unload where possible
        if (navigator?.sendBeacon) {
          const url = "/api/activities/track";
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
      // Also attempt a graceful session_end on unmount (SPA navigation away)
      try {
        trackSessionEnd();
      } catch {
        // noop
      }
    };
  }, []);

  // Track page_view on route change
  useEffect(() => {
    try {
      trackPageView(location.pathname);
    } catch {
      // noop
    }
  }, [location.pathname]);
}
