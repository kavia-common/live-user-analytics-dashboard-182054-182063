import 'dotenv/config';

/**
 * PUBLIC_INTERFACE
 * getEnv returns strongly-typed environment configuration.
 * Reads and validates required env vars, providing defaults where applicable.
 */
export function getEnv() {
  const {
    MONGODB_URI,
    JWT_SECRET,
    PORT,
    CORS_ORIGIN,
    SOCKET_PATH,
    NODE_ENV,
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable.');
  }

  return {
    MONGODB_URI,
    JWT_SECRET,
    PORT: PORT ? parseInt(PORT, 10) : 4000,
    CORS_ORIGIN: CORS_ORIGIN || '*',
    SOCKET_PATH: SOCKET_PATH || '/socket.io',
    NODE_ENV: NODE_ENV || 'development',
  };
}

/**
 * PUBLIC_INTERFACE
 * isProd indicates if the environment is production.
 */
export function isProd(): boolean {
  return (process.env.NODE_ENV || 'development') === 'production';
}
