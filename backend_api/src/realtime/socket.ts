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
 * Clients should connect using a Clerk JWT in either:
 *  - query: { token: 'Bearer <jwt>' } or { token: '<jwt>' }
 *  - auth: { token: 'Bearer <jwt>' } during connection
 */
export function initSocket(httpServer: HttpServer, corsOrigin: string | string[], socketPath: string): { io: SocketIOServer; channels: RealTimeChannels } {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
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
      let bearer = tokenFromQuery || authHeader || '';
      if (bearer?.startsWith('Bearer ')) bearer = bearer.substring(7);

      debugLog('socket:auth', 'Verifying Clerk token (namespace middleware)', {
        hasQueryToken: !!tokenFromQuery,
        hasAuthHeader: !!authHeader,
        tokenLength: bearer ? bearer.length : 0,
      });

      if (!bearer) {
        return next(new Error('Unauthorized: Missing token'));
      }

      const fakeReq: any = {
        headers: {
          authorization: `Bearer ${bearer}`,
        },
      };
      const auth = getAuth(fakeReq);
      if (!auth?.userId) {
        return next(new Error('Unauthorized'));
      }

      const claims = (auth as any).sessionClaims || {};
      const email: string =
        claims.email ||
        claims.email_address ||
        claims.primary_email ||
        (Array.isArray(claims.emails) ? claims.emails[0] : '') ||
        '';

      const role: 'admin' | 'user' = email && ADMIN_EMAILS.has(String(email).toLowerCase()) ? 'admin' : 'user';
      (socket as any).user = { id: auth.userId, email: String(email || ''), role };
      debugLog('socket:auth', 'Clerk OK for socket', { userId: auth.userId, role });
      return next();
    } catch (err) {
      debugError('socket:auth', 'Clerk verification failed for socket', err);
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
