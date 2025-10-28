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
      // Resolve base URL: prefer socket URL, then API URL; include composite fallbacks
      const directSocket = process.env.REACT_APP_SOCKET_URL || process.env["REACT_APP_frontend_dashboard.REACT_APP_SOCKET_URL"];
      const directApi = process.env.REACT_APP_API_URL || process.env["REACT_APP_frontend_dashboard.REACT_APP_API_URL"];
      const explicitBase = directSocket || directApi || null;
      const url = explicitBase ? `${String(explicitBase).replace(/\/+$/, "")}/realtime` : undefined;
      const SOCKET_PATH =
        process.env.REACT_APP_SOCKET_PATH ||
        process.env["REACT_APP_frontend_dashboard.REACT_APP_SOCKET_PATH"] ||
        "/socket.io";

      const getToken = getClerkTokenProvider();
      if (!getToken) {
        // eslint-disable-next-line no-console
        console.debug("[socket] No token provider yet; skipping connect");
        return;
      }
      const token = await getToken();
      if (!token || cancelled) {
        // eslint-disable-next-line no-console
        console.debug("[socket] Token unavailable or effect cancelled; skipping connect");
        return;
      }

      const s = io(url, {
        path: SOCKET_PATH,
        transports: ["websocket"],
        auth: { token: `Bearer ${token}` },
      });
      socketRef.current = s;

      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
      s.on("connected", () => {
        // eslint-disable-next-line no-console
        console.debug("[socket] connected");
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
