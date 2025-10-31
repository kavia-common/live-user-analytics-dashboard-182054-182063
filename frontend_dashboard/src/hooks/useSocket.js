import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Resolve socket URL and path from environment with same-origin defaults.
 */
function resolveSocketParams() {
  const RAW_SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || '').trim();
  // Undefined URL => same-origin; if provided, use as-is (should include protocol/host)
  const url = RAW_SOCKET_URL.length ? RAW_SOCKET_URL.replace(/\/+$/, '') : undefined;

  const RAW_PATH = (process.env.REACT_APP_SOCKET_PATH || '/socket.io').trim();
  const path = RAW_PATH.startsWith('/') ? RAW_PATH : `/${RAW_PATH}`;

  return { url, path };
}

/**
 * PUBLIC_INTERFACE
 * useSocket
 * A React hook that creates and manages a Socket.IO connection, same-origin by default.
 *
 * - URL: undefined (same-origin) unless REACT_APP_SOCKET_URL is set.
 * - Path: REACT_APP_SOCKET_PATH or '/socket.io'.
 * - Sends Clerk token if available via Authorization header and auth.token.
 */
export default function useSocket() {
  const socketRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [error, setError] = useState(null);

  const connectSocket = useCallback(async () => {
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }

    const { url, path } = resolveSocketParams();

    // Attempt to retrieve a Clerk auth token
    let token = null;
    try {
      const clerk = (typeof window !== 'undefined' && (window.Clerk || window.clerk)) || null;
      const session = clerk && clerk.session;
      if (session && typeof session.getToken === 'function') {
        token = await session.getToken({ template: 'default' }).catch(() => null);
      }
    } catch {
      // continue unauthenticated
    }

    setStatus('connecting');
    setError(null);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const auth = token ? { token } : {};

    const socket = io(url, {
      path,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      extraHeaders: headers,
      auth,
    });

    socket.on('connect', () => {
      setStatus('connected');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      setStatus('error');
      setError(err?.message || 'Socket connection error');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });

    socketRef.current = socket;
    return socket;
  }, []);

  useEffect(() => {
    connectSocket();
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners && socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  /**
   * PUBLIC_INTERFACE
   * Subscribe to a socket event safely.
   */
  const subscribe = useCallback((event, handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => {
      if (!socketRef.current) return;
      socketRef.current.off(event, handler);
    };
  }, []);

  /**
   * PUBLIC_INTERFACE
   * Emit a socket event safely.
   */
  const emit = useCallback((event, payload) => {
    if (!socketRef.current) return;
    socketRef.current.emit(event, payload);
  }, []);

  return {
    socket: socketRef.current,
    status,
    error,
    subscribe,
    emit,
  };
}
