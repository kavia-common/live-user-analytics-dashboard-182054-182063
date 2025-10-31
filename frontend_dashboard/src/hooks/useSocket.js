import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * PUBLIC_INTERFACE
 * useSocket
 * A reusable hook to open an authenticated Socket.IO connection to the backend /realtime namespace.
 * - Attaches Clerk Bearer token in auth payload (from window.Clerk if available)
 * - Uses SOCKET_PATH if provided (REACT_APP_SOCKET_PATH)
 * - Auto-reconnects with backoff and retries token on reconnect
 * - Accepts onConnect/onDisconnect and a catch-all onEvent handler
 *
 * Usage:
 * const socketRef = useSocket({ onEvent: (event, payload) => {} });
 * const socket = socketRef.current;
 */
export default function useSocket({ onConnect, onDisconnect, onEvent } = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const BASE_URL =
      process.env.REACT_APP_frontend_dashboard_REACT_APP_SOCKET_URL ||
      process.env.REACT_APP_SOCKET_URL ||
      process.env.REACT_APP_API_URL ||
      "";

    if (!BASE_URL) {
      console.warn(
        "Socket URL not configured (REACT_APP_SOCKET_URL or REACT_APP_API_URL). Realtime disabled."
      );
      return undefined;
    }

    const SOCKET_PATH =
      process.env.REACT_APP_frontend_dashboard_REACT_APP_SOCKET_PATH ||
      process.env.REACT_APP_SOCKET_PATH ||
      "/socket.io";

    // Attempt to get Clerk session token without importing SDK here (keep hook light)
    const getAuthToken = async () => {
      try {
        if (typeof window !== "undefined" && window.Clerk && window.Clerk.session) {
          const token = await window.Clerk.session.getToken({ template: "default" });
          return token || null;
        }
      } catch (e) {
        console.warn("[useSocket] Clerk token fetch failed:", e?.message || e);
      }
      return null;
    };

    let cancelled = false;
    let socket;

    const connect = async () => {
      const token = await getAuthToken();
      if (cancelled) return;

      // Normalize URL and namespace
      const base = String(BASE_URL).replace(/\/*$/, "");
      const namespace = "/realtime";

      socket = io(`${base}${namespace}`, {
        path: SOCKET_PATH,
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        // Provide token both in auth and query for broader backend compatibility
        auth: token ? { token: `Bearer ${token}` } : {},
        query: token ? { token: `Bearer ${token}` } : {},
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        onConnect && onConnect(socket);
      });

      socket.on("disconnect", (reason) => {
        onDisconnect && onDisconnect(reason);
      });

      // On reconnect_attempt, try to refresh token
      socket.io.on("reconnect_attempt", async () => {
        const t = await getAuthToken();
        if (t) {
          socket.auth = { token: `Bearer ${t}` };
          socket.io.opts.query = { ...(socket.io.opts.query || {}), token: `Bearer ${t}` };
        }
      });

      if (onEvent && typeof onEvent === "function") {
        socket.onAny((event, ...args) => {
          onEvent(event, ...args);
        });
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.close();
        } catch {
          // ignore
        }
        socketRef.current = null;
      }
    };
  }, [onConnect, onDisconnect, onEvent]);

  return socketRef;
}
