import { useEffect } from 'react';
import useBackendHealth from './useBackendHealth';

/**
 * PUBLIC_INTERFACE
 * useActivityTracking
 * Temporarily disabled: tracking functions are no-ops to avoid backend spam and loops.
 * When re-enabling, ensure backend is healthy and avoid duplicate calls.
 */
export function useActivityTracking(isEnabled = true) {
  const backendHealthy = useBackendHealth();

  useEffect(() => {
    if (!isEnabled) return;
    if (backendHealthy === false) return;

    const trackPageView = async () => {
      // eslint-disable-next-line no-console
      console.log('[tracking:no-op] page_view');
      return Promise.resolve();
    };

    const trackSessionStart = async () => {
      // eslint-disable-next-line no-console
      console.log('[tracking:no-op] session_start');
      return Promise.resolve();
    };

    // Fire once on mount
    trackSessionStart();
    trackPageView();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        trackPageView();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isEnabled, backendHealthy]);
}
