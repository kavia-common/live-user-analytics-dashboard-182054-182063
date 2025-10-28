import 'dotenv/config';
import http from 'http';
import { connectMongo } from './db/mongoose.js';
import { getEnv } from './config/env.js';
import { createApp } from './app.js';
import { initSocket } from './realtime/socket.js';
import { startChangeStreams } from './realtime/changeStreams.js';
import { debugLog, debugError } from './utils/debug.js';

async function bootstrap() {
  const { PORT, CORS_ORIGIN, SOCKET_PATH, NODE_ENV } = getEnv();

  debugLog('server', 'Bootstrap starting', {
    PORT,
    CORS_ORIGIN,
    SOCKET_PATH,
    NODE_ENV,
  });

  // Build Express app
  const app = createApp();

  // Create HTTP server, init Socket.io with JWT auth
  const httpServer = http.createServer(app);
  // Convert CORS_ORIGIN array to comma-separated string for socket.io
  const corsOriginStr = Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN.join(',') : CORS_ORIGIN;
  const { channels } = initSocket(httpServer, corsOriginStr, SOCKET_PATH);

  // Start server first so CORS/preflight and health are available even if DB is down
  httpServer.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`backend_api listening on http://0.0.0.0:${PORT}`);
  });

  // Attempt to connect to MongoDB without crashing the server on failure
  try {
    await connectMongo();
    await startChangeStreams(channels.realtimeNamespace);
    debugLog('server', 'Mongo connected and change streams started');
  } catch (err) {
    debugError('server', 'Mongo connection failed; API server remains up for health/CORS', err);
    // Optionally, retry strategy could be implemented here.
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal server error:', err);
  process.exit(1);
});
