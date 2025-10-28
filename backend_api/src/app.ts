import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import activitiesRoutes from './routes/activities.js';
import statsRoutes from './routes/stats.js';
import e2eRoutes from './routes/e2e.js';
import { errorHandler } from './middleware/error.js';
import { getEnv } from './config/env.js';
import { debugLog } from './utils/debug.js';

/**
 * PUBLIC_INTERFACE
 * createApp constructs the Express application with routes and middleware.
 */
export function createApp() {
  const { CORS_ORIGIN, NODE_ENV } = getEnv();

  const app = express();

  // Security and middleware
  app.use(helmet());

  // Build allowed origins list with dev-friendly defaults
  const allowed = Array.isArray(CORS_ORIGIN) ? CORS_ORIGIN : [CORS_ORIGIN as any];
  const devDefaults = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const effectiveAllowed = NODE_ENV === 'production' ? allowed : Array.from(new Set([...allowed, ...devDefaults]));

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Allow same-origin requests (no origin) and any of the configured origins
      if (!origin) return callback(null, true);
      if (effectiveAllowed.includes(origin) || effectiveAllowed.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  // Pre-handle OPTIONS for all routes explicitly with same options
  app.options('*', cors(corsOptions));

  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  // Log CORS configuration in non-production for diagnostics
  debugLog('cors', 'Configured CORS origins', { origins: effectiveAllowed });

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

  // PUBLIC_INTERFACE
  app.get('/api/health', (_req: Request, res: Response) => {
    /**
     * API health endpoint under /api prefix to align with frontend proxy checks.
     * Returns 200 OK with environment info.
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
  // Minimal E2E routes for health and dev-only auth isolation
  app.use('/api/e2e', e2eRoutes);

  // Ensure unknown /api routes return JSON 404 (not HTML) to avoid XML/HTML parsing issues
  app.use('/api', (req: Request, res: Response) => {
    res.type('application/json');
    return res.status(404).json({ error: 'Not Found' });
  });

  // For any non-API unknown route, also return JSON (prevents HTML default)
  app.use((req: Request, res: Response) => {
    res.type('application/json');
    return res.status(404).json({ error: 'Not Found' });
  });

  // Error handler (should be last)
  app.use(errorHandler);

  return app;
}
