import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuthContext } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * useSocket connects to the /realtime namespace using Clerk JWT and returns socket and live events.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [lastStats, setLastStats] = useState(null);
  const socketRef = useRef(null);

  // Call hook at top level
  const { token } = useAuthContext();

  useEffect(() => {
    // Tear down any previous socket when token changes to re-auth
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Resolve base URL: prefer standardized CRA envs; fall back to same-origin (CRA proxy)
    const directSocket = process.env.REACT_APP_SOCKET_URL;
    const directApi = process.env.REACT_APP_API_URL;
    const explicitBase = directSocket || directApi || null;
    const url = explicitBase ? `${String(explicitBase).replace(/\/*$/, "")}/realtime` : undefined;
    if (!explicitBase && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[socket] REACT_APP_SOCKET_URL not set; using same-origin via CRA proxy.");
    }

    const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || "/socket.io";

    const authHeader = token ? { token: `Bearer ${token}` } : undefined;
    if (!token && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[socket] No auth token available; connecting without auth (dev)");
    }

    const s = io(url, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      auth: authHeader,
    });
    socketRef.current = s;

    s.on("connect", () => {
      // eslint-disable-next-line no-console
      console.log("[socket] ✓ Connected to realtime namespace");
      setConnected(true);
    });
    s.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log("[socket] ✗ Disconnected from realtime");
      setConnected(false);
    });
    s.on("connected", () => {
      // eslint-disable-next-line no-console
      console.log("[socket] ✓ Handshake confirmed");
    });
    s.on("connect_error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[socket] Connection error:", err.message);
    });

    s.on("activity:new", (payload) => {
      // eslint-disable-next-line no-console
      console.log("[socket] 📥 Activity received:", payload?.type);
      setLastActivity(payload);
    });

    s.on("stats:update", (payload) => {
      // eslint-disable-next-line no-console
      console.log("[socket] 📊 Stats update received");
      setLastStats(payload);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  return { socket: socketRef.current, connected, lastActivity, lastStats };
}
