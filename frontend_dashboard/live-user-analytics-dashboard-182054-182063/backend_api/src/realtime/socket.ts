import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Namespace, Socket } from 'socket.io';
import { getAuth } from '@clerk/clerk-sdk-node';
import { getEnv } from '../config/env.js';
import { debugLog, debugError } from '../utils/debug.js';

export interface RealTimeChannels {
  realtimeNamespace: Namespace;
}

/**
 * PUBLIC_INTERFACE
 * initSocket initializes Socket.io with CORS and Clerk auth on /realtime namespace.
 */
export function initSocket(httpServer: HttpServer, corsOrigin: string | string[], socketPath: string): { io: SocketIOServer; channels: RealTimeChannels } {
  const origins = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    path: socketPath,
  });

  const { ADMIN_EMAILS } = getEnv();
  const realtime = io.of('/realtime');

  // Clerk auth middleware for namespace
  realtime.use((socket: Socket, next) => {
    try {
      const tokenFromQuery = socket.handshake.query?.token as string | undefined;
      const authHeader = (socket.handshake.auth?.token as string | undefined) || (socket.handshake.headers['authorization'] as string | undefined);
      let token: string | null = null;

      if (tokenFromQuery) {
        token = tokenFromQuery;
      } else if (typeof authHeader === 'string') {
        token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      }

      debugLog('socket:auth', 'Verifying socket token (Clerk)', {
        hasQueryToken: !!tokenFromQuery,
        hasAuthHeader: !!authHeader,
        tokenLength: token ? token.length : 0,
      });

      if (!token) {
        return next(new Error('Unauthorized: Missing token'));
      }

      const reqLike: any = { headers: { authorization: `Bearer ${token}` } };
      const auth = getAuth(reqLike);
      if (!auth?.userId) return next(new Error('Unauthorized'));
      const email = (auth.sessionClaims as any)?.email as string | undefined;
      const role: 'admin' | 'user' =
        email && ADMIN_EMAILS.has(String(email).toLowerCase()) ? 'admin' : 'user';
      (socket as any).user = { id: auth.userId, email: email || '', role };
      debugLog('socket:auth', 'Socket Clerk auth OK', { userId: auth.userId, role });
      return next();
    } catch (err) {
      debugError('socket:auth', 'Socket Clerk verify failed', err);
      return next(new Error('Unauthorized'));
    }
  });

  realtime.on('connection', (socket) => {
    socket.emit('connected', { message: 'Realtime connected' });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return { io, channels: { realtimeNamespace: realtime } };
}
