import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import activitiesRoutes from './routes/activities.js';
import statsRoutes from './routes/stats.js';
import { errorHandler } from './middleware/error.js';
import { getEnv } from './config/env.js';

/**
 * PUBLIC_INTERFACE
 * createApp constructs the Express application with routes and middleware.
 */
export function createApp() {
  const { CORS_ORIGIN } = getEnv();

  const app = express();

  // Security and middleware
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin requests (no origin) and any of the configured origins
        if (!origin) return callback(null, true);
        const allowed = Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN : [CORS_ORIGIN as any];
        if (allowed.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      allowedHeaders: ['Authorization', 'Content-Type'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      optionsSuccessStatus: 204,
    })
  );
  // Pre-handle OPTIONS for all routes
  app.options('*', cors());

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
     * Health endpoint for uptime monitoring.
     */
    return res.status(200).json({
      status: 'ok',
      env: process.env.NODE_ENV || 'development',
      time: new Date().toISOString(),
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/activities', activitiesRoutes);
  app.use('/api/stats', statsRoutes);

  // Error handler (should be last)
  app.use(errorHandler);

  return app;
}
