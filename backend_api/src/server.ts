import 'dotenv/config';
import http from 'http';
import { connectMongo } from './db/mongoose.js';
import { getEnv } from './config/env.js';
import { createApp } from './app.js';
import { initSocket } from './realtime/socket.js';
import { startChangeStreams } from './realtime/changeStreams.js';
import { debugLog } from './utils/debug.js';

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
  const { channels } = initSocket(httpServer, CORS_ORIGIN, SOCKET_PATH);

  // Connect to MongoDB
  await connectMongo();

  // Start MongoDB Change Streams emitting to realtime namespace
  await startChangeStreams(channels.realtimeNamespace);

  // Start server
  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`backend_api listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal server error:', err);
  process.exit(1);
});
