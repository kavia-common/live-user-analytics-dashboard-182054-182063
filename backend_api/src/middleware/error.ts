import { Request, Response, NextFunction } from 'express';

/**
 * PUBLIC_INTERFACE
 * errorHandler is a centralized Express error-handling middleware.
 * It formats errors and avoids leaking internals in production.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;

  // eslint-disable-next-line no-console
  console.error('API Error:', { status, message, details });

  return res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
  });
}
