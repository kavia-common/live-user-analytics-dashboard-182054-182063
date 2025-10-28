import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Namespace, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { debugLog, debugError } from '../utils/debug.js';

export interface SocketAuthPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface RealTimeChannels {
  realtimeNamespace: Namespace;
}

/**
 * PUBLIC_INTERFACE
 * initSocket initializes Socket.io with CORS and JWT auth on /realtime namespace.
 */
export function initSocket(httpServer: HttpServer, corsOrigin: string, socketPath: string): { io: SocketIOServer; channels: RealTimeChannels } {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    path: socketPath,
  });

  const { JWT_SECRET } = getEnv();
  const realtime = io.of('/realtime');

  // JWT auth middleware for namespace
  realtime.use((socket: Socket, next) => {
    try {
      // Accept token as query.token or Authorization header
      const tokenFromQuery = socket.handshake.query?.token as string | undefined;
      const authHeader = (socket.handshake.auth?.token as string | undefined) || (socket.handshake.headers['authorization'] as string | undefined);
      let token: string | null = null;

      if (tokenFromQuery) {
        token = tokenFromQuery;
      } else if (typeof authHeader === 'string') {
        token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      }

      debugLog('socket:auth', 'Verifying socket token', {
        hasQueryToken: !!tokenFromQuery,
        hasAuthHeader: !!authHeader,
        tokenLength: token ? token.length : 0,
      });

      if (!token) {
        return next(new Error('Unauthorized: Missing token'));
      }

      const payload = jwt.verify(token, JWT_SECRET) as SocketAuthPayload & { iat: number; exp: number };
      (socket as any).user = { id: payload.id, email: payload.email, role: payload.role };
      debugLog('socket:auth', 'Socket token OK', { userId: payload.id, role: payload.role });
      return next();
    } catch (err) {
      debugError('socket:auth', 'Socket token verify failed', err);
      return next(new Error('Unauthorized: Invalid or expired token'));
    }
  });

  realtime.on('connection', (socket) => {
    // Emit a handshake confirmation
    socket.emit('connected', { message: 'Realtime connected' });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return { io, channels: { realtimeNamespace: realtime } };
}
