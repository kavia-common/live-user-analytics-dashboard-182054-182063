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
    CLERK_JWT_ISSUER,
    ADMIN_EMAILS,
    LOCAL_JWT_AUTH,
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  // If legacy auth is enabled, JWT_SECRET is required
  const legacyAuth = String(LOCAL_JWT_AUTH || '').toLowerCase() === 'true';
  if (legacyAuth && !JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable (required when LOCAL_JWT_AUTH=true).');
  }

  // Support multiple origins via comma-separated list, and trim spaces
  const parsedCors = (CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Build a set of admin emails (lowercased)
  const adminEmailSet = new Set(
    (ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
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
    CLERK_JWT_ISSUER: CLERK_JWT_ISSUER || '',
    ADMIN_EMAILS: adminEmailSet,
    LOCAL_JWT_AUTH: legacyAuth,
  };
}

/**
 * PUBLIC_INTERFACE
 * isProd indicates if the environment is production.
 */
export function isProd(): boolean {
  return (process.env.NODE_ENV || 'development') === 'production';
}
