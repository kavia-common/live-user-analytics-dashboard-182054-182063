import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/apiClient';

// PUBLIC_INTERFACE
export function useBackendHealth(pollMs = 20000) {
  /** Returns { healthy, loading, error } and rechecks periodically */
  const [healthy, setHealthy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const withTimeout = (p, ms = 2500) =>
      Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
      ]);

    const check = async () => {
      setLoading(true);
      try {
        if (!API_BASE_URL) {
          setHealthy(false);
          setError(new Error('API URL missing'));
          return;
        }
        const res = await withTimeout(fetch(`${API_BASE_URL}/health`), 2500);
        if (!res.ok) throw new Error('not ok');
        if (!cancelled) {
          setHealthy(true);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setHealthy(false);
          setError(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    timer = setInterval(check, pollMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  return { healthy, loading, error };
}
