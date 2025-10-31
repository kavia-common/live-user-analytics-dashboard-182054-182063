import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Resolves base URLs and paths from environment with sane defaults.
 */
function getSocketConfig() {
  const API_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_frontend_dashboard__REACT_APP_API_URL || '';
  const SOCKET_URL =
    process.env.REACT_APP_SOCKET_URL ||
    process.env.REACT_APP_frontend_dashboard__REACT_APP_SOCKET_URL ||
    API_URL?.replace(/\/+$/, ''); // fallback to API_URL if provided

  // Ensure path starts with /
  const rawPath =
    process.env.REACT_APP_SOCKET_PATH ||
    process.env.REACT_APP_frontend_dashboard__REACT_APP_SOCKET_PATH ||
    '/socket.io';
  const SOCKET_PATH = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  // Optional namespace; backend may mount at '/realtime' or root
  const NAMESPACE =
    process.env.REACT_APP_SOCKET_NAMESPACE ||
    process.env.REACT_APP_frontend_dashboard__REACT_APP_SOCKET_NAMESPACE ||
    '/realtime'; // default to '/realtime' as backend namespace

  return { SOCKET_URL, SOCKET_PATH, NAMESPACE };
}

/**
 * PUBLIC_INTERFACE
 * useSocket
 * A React hook that creates and manages a Socket.IO connection authenticated via Clerk.
 *
 * - Attempts to get a Clerk token using window.Clerk if available.
 * - Sends token in auth payload and as Bearer header for proxy compatibility.
 * - Supports custom socket path and namespace via env.
 * - Gracefully no-ops if token or Clerk is not available.
 */
export function useSocket() {
  /** This is a public hook that provides a connected Socket.IO client and helpers. */
  const socketRef = useRef(null);
  const [status, setStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [error, setError] = useState(null);

  const connectSocket = useCallback(async () => {
    // If already connected, skip
    if (socketRef.current && socketRef.current.connected) {
      return socketRef.current;
    }

    const { SOCKET_URL, SOCKET_PATH, NAMESPACE } = getSocketConfig();

    // Attempt to retrieve a Clerk auth token; if unavailable, connect unauthenticated but restrict subscriptions
    let token = null;
    try {
      const clerk = (typeof window !== 'undefined' && (window.Clerk || window.clerk)) || null;
      const session = clerk && clerk.session;
      if (session && typeof session.getToken === 'function') {
        token = await session.getToken({ template: 'default' }).catch(() => null);
      }
    } catch (e) {
      // no-op, will continue unauthenticated
    }

    // Build URL with namespace if provided
    const baseUrl = SOCKET_URL || window.location.origin;
    const url = `${baseUrl}${NAMESPACE || ''}`;

    setStatus('connecting');
    setError(null);

    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    const auth = token ? { token } : {};

    const socket = io(url, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      extraHeaders: headers,
      auth,
    });

    // Wire events
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
    // Connect on mount
    let mounted = true;
    connectSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        try {
          socketRef.current.offAny && socketRef.current.offAny(() => {});
          socketRef.current.removeAllListeners && socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (e) {
          // ignore
        }
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  // PUBLIC_INTERFACE
  const subscribe = useCallback((event, handler) => {
    /** Subscribe to a socket event safely. */
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, handler);
    return () => {
      if (!socketRef.current) return;
      socketRef.current.off(event, handler);
    };
  }, []);

  // PUBLIC_INTERFACE
  const emit = useCallback((event, payload) => {
    /** Emit a socket event safely. */
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

export default useSocket;
