import { useEffect, useState } from 'react';
import { getClient, rawBaseUrl } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * useBackendHealth
 * Returns a boolean or null (unknown) indicating whether the backend is healthy.
 * It performs a single ping to /api/health on mount and caches the result for the session.
 */
export default function useBackendHealth() {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        // We intentionally use fetch to avoid axios interceptors altering behavior.
        const res = await fetch(`${rawBaseUrl()}/api/health`, {
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' },
        });
        if (!mounted) return;
        setHealthy(res.ok);
      } catch (e) {
        if (!mounted) return;
        setHealthy(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, []);

  return healthy;
}
