import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getClerkTokenProvider } from "../context/AuthContext";

/**
 * PUBLIC_INTERFACE
 * useSocket connects to the /realtime namespace using Clerk JWT and returns socket and live events.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [lastStats, setLastStats] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const explicitBase =
        process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || null;
      const url = explicitBase ? `${explicitBase}/realtime` : undefined;
      const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || "/socket.io";

      const getToken = getClerkTokenProvider();
      if (!getToken) return;
      const token = await getToken();
      if (!token || cancelled) return;

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
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { socket: socketRef.current, connected, lastActivity, lastStats };
}
