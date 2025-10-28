import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/**
 * PUBLIC_INTERFACE
 * useSocket connects to the /realtime namespace using JWT and returns socket and live events.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [lastStats, setLastStats] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Same-origin by default: let socket.io use the current host when `url` is undefined.
    // For split-host dev, allow explicit overrides via env.
    const explicitBase =
      process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || null;
    const url = explicitBase ? `${explicitBase}/realtime` : undefined;
    const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || "/socket.io"; // keep in sync with backend SOCKET_PATH
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io(url, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      auth: { token: `Bearer ${token}` },
    });
    socketRef.current = s;

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connected", () => {
      /* handshake */
    });

    s.on("activity:new", (payload) => {
      setLastActivity(payload);
    });

    s.on("stats:update", (payload) => {
      setLastStats(payload);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, connected, lastActivity, lastStats };
}
