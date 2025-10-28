import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import { connectMongo } from './db/mongoose.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const SOCKET_PATH = process.env.SOCKET_PATH || '/socket.io';

async function bootstrap() {
  // Create Express app
  const app = express();

  // Security and middleware
  app.use(helmet());
  app.use(
    cors({
      origin: CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  // Basic rate limiter to protect API
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Health check
  // PUBLIC_INTERFACE
  app.get('/health', (_req: Request, res: Response) => {
    /**
     * This endpoint checks if the API server is running.
     * Returns 200 and basic status info.
     */
    return res.status(200).json({
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  });

  // Create HTTP server and Socket.io
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    path: SOCKET_PATH,
  });

  io.on('connection', (socket) => {
    // Socket connected
    socket.emit('connected', { message: 'Socket connected' });
    socket.on('disconnect', () => {
      // Socket disconnected
    });
  });

  // Connect to MongoDB
  await connectMongo();

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
