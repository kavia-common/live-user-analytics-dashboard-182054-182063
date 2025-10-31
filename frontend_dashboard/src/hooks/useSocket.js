import { useEffect, useRef, useState } from 'react';

/**
 * Read socket URL/path from CRA build-time env with runtime window.__CONFIG__ fallbacks.
 * Never rely on `process` at runtime; CRA replaces process.env.REACT_APP_* at build time.
 */
const BUILD_SOCKET_URL =
  (process.env.REACT_APP_frontend_dashboard &&
    process.env.REACT_APP_frontend_dashboard.REACT_APP_SOCKET_URL) ||
  process.env.REACT_APP_SOCKET_URL ||
  '';

const BUILD_SOCKET_PATH =
  (process.env.REACT_APP_frontend_dashboard &&
    process.env.REACT_APP_frontend_dashboard.REACT_APP_SOCKET_PATH) ||
  process.env.REACT_APP_SOCKET_PATH ||
  '';

const RUNTIME_SOCKET_URL =
  (typeof window !== 'undefined' &&
    window.__CONFIG__ &&
    (window.__CONFIG__.REACT_APP_SOCKET_URL || window.__CONFIG__.SOCKET_URL)) ||
  '';

const RUNTIME_SOCKET_PATH =
  (typeof window !== 'undefined' &&
    window.__CONFIG__ &&
    (window.__CONFIG__.REACT_APP_SOCKET_PATH || window.__CONFIG__.SOCKET_PATH)) ||
  '';

const SOCKET_URL = (BUILD_SOCKET_URL || RUNTIME_SOCKET_URL || '').replace(/\/+$/, '');
const SOCKET_PATH = (BUILD_SOCKET_PATH || RUNTIME_SOCKET_PATH || '/socket.io') || '/socket.io';

// Lazy import to avoid hard dependency if socket.io-client not installed by template
let ioLib = null;
async function ensureIo() {
  if (ioLib) return ioLib;
  try {
    ioLib = await import('socket.io-client');
  } catch (e) {
    console.warn('socket.io-client not installed; running without realtime.', e?.message);
    ioLib = null;
  }
  return ioLib;
}

// PUBLIC_INTERFACE
export function useSocket(namespace = '/', opts = {}) {
  /**
   * Connects to socket if env is provided and socket.io-client is available.
   * Returns { socket, connected, error }
   */
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const io = (await ensureIo())?.io;
      if (!io || !SOCKET_URL) {
        if (!SOCKET_URL) console.warn('SOCKET_URL not set; realtime disabled.');
        return;
      }

      try {
        const url = SOCKET_URL + (namespace || '/');
        const socket = io(url, {
          path: SOCKET_PATH,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          autoConnect: true,
          ...opts,
        });
        socketRef.current = socket;

        socket.on('connect', () => active && setConnected(true));
        socket.on('disconnect', () => active && setConnected(false));
        socket.on('connect_error', (err) => {
          console.warn('Socket connect_error:', err?.message);
          if (active) setError(err);
        });
      } catch (e) {
        console.warn('Socket initialization failed:', e?.message);
        if (active) setError(e);
      }
    })();

    return () => {
      active = false;
      if (socketRef.current) {
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
    };
  }, [namespace, opts]);

  return { socket: socketRef.current, connected, error };
}
