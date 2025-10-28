import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../utils/activity";

/**
 * PUBLIC_INTERFACE
 * useActivityTracking automatically tracks page views on route changes.
 * Call this hook once in the root component (App or Router) to enable automatic tracking.
 */
export function useActivityTracking() {
  const location = useLocation();

  useEffect(() => {
    // Track page view whenever location changes
    trackPageView(location.pathname);
  }, [location.pathname]);
}
