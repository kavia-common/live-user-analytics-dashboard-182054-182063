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
    CLERK_SECRET_KEY,
    ADMIN_EMAILS,
    LOCAL_JWT_AUTH,
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  // JWT_SECRET is only required if LOCAL_JWT_AUTH is enabled
  const localJwtAuth = LOCAL_JWT_AUTH === 'true';
  if (localJwtAuth && !JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable (required when LOCAL_JWT_AUTH=true).');
  }

  if (!CLERK_SECRET_KEY) {
    // eslint-disable-next-line no-console
    console.warn('CLERK_SECRET_KEY not set. Clerk authentication will not work.');
  }

  // Support multiple origins via comma-separated list, and trim spaces
  const parsedCors = (CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Parse admin emails into a Set for fast lookup
  const adminEmailsSet = new Set(
    (ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    MONGODB_URI,
    JWT_SECRET: JWT_SECRET || '',
    PORT: PORT ? parseInt(PORT, 10) : 4000,
    CORS_ORIGIN: parsedCors,
    SOCKET_PATH: SOCKET_PATH || '/socket.io',
    NODE_ENV: NODE_ENV || 'development',
    CLERK_SECRET_KEY: CLERK_SECRET_KEY || '',
    ADMIN_EMAILS: adminEmailsSet,
    LOCAL_JWT_AUTH: localJwtAuth,
  };
}

/**
 * PUBLIC_INTERFACE
 * isProd indicates if the environment is production.
 */
export function isProd(): boolean {
  return (process.env.NODE_ENV || 'development') === 'production';
}
