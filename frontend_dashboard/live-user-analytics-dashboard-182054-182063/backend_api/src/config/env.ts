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

  // Use CLERK_SECRET_KEY as JWT_SECRET fallback for socket auth with Clerk tokens
  const clerkSecret = CLERK_SECRET_KEY || '';
  const jwtSecret = JWT_SECRET || clerkSecret || 'dev-secret-change-in-prod';

  // Support multiple origins via comma-separated list, and trim spaces
  const parsedCors = (CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    MONGODB_URI,
    JWT_SECRET: jwtSecret,
    PORT: PORT ? parseInt(PORT, 10) : 4000,
    CORS_ORIGIN: parsedCors,
    SOCKET_PATH: SOCKET_PATH || '/socket.io',
    NODE_ENV: NODE_ENV || 'development',
    CLERK_SECRET_KEY: clerkSecret,
    LOCAL_JWT_AUTH: LOCAL_JWT_AUTH === 'true',
    ADMIN_EMAILS: new Set(
      (ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  };
}

/**
 * PUBLIC_INTERFACE
 * isProd indicates if the environment is production.
 */
export function isProd(): boolean {
  return (process.env.NODE_ENV || 'development') === 'production';
}
