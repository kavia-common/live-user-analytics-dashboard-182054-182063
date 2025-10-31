import 'dotenv/config';

/**
 * PUBLIC_INTERFACE
 * getEnv returns strongly-typed environment configuration for the backend API.
 * Validates required vars and provides safe defaults where appropriate.
 *
 * Required:
 * - MONGODB_URI
 * - CLERK_SECRET_KEY (for Clerk JWT verification in API and Socket.io)
 *
 * Optional:
 * - CORS_ORIGIN (CSV list) → defaults to http://localhost:3000 in non-prod
 * - PORT → default 4000
 * - SOCKET_PATH → default /socket.io
 * - NODE_ENV → default development
 * - ADMIN_EMAILS → CSV of admin emails used for role mapping
 * - LOCAL_JWT_AUTH → default false; when true, enables legacy local auth endpoints (dev only)
 * - JWT_SECRET → required only when LOCAL_JWT_AUTH=true
 * - CLERK_JWT_ISSUER → optional issuer override if using a custom Clerk JWT template
 */
export function getEnv() {
  const {
    MONGODB_URI,
    PORT,
    CORS_ORIGIN,
    SOCKET_PATH,
    NODE_ENV,
    ADMIN_EMAILS,
    LOCAL_JWT_AUTH,
    JWT_SECRET,
    CLERK_SECRET_KEY,
    CLERK_JWT_ISSUER,
  } = process.env;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }
  if (!CLERK_SECRET_KEY) {
    throw new Error('Missing CLERK_SECRET_KEY environment variable.');
  }

  // LOCAL_JWT_AUTH flag controls legacy endpoints; default to false for Clerk-only flows
  const localJwtAuth = String(LOCAL_JWT_AUTH || 'false').toLowerCase() === 'true';
  if (localJwtAuth && !JWT_SECRET) {
    throw new Error('LOCAL_JWT_AUTH=true requires JWT_SECRET to be set.');
  }

  // Support multiple origins via comma-separated list, trim spaces; dev default allows CRA
  const parsedCors = (CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // ADMIN_EMAILS mapping (lowercase) for role resolution
  const adminEmailsSet = new Set(
    (ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    MONGODB_URI,
    PORT: PORT ? parseInt(PORT, 10) : 4000,
    CORS_ORIGIN: parsedCors,
    SOCKET_PATH: SOCKET_PATH || '/socket.io',
    NODE_ENV: NODE_ENV || 'development',
    ADMIN_EMAILS: adminEmailsSet,
    LOCAL_JWT_AUTH: localJwtAuth,
    JWT_SECRET: JWT_SECRET || '',

    // Clerk configuration
    CLERK_SECRET_KEY,
    CLERK_JWT_ISSUER: CLERK_JWT_ISSUER || undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * isProd indicates if the environment is production.
 */
export function isProd(): boolean {
  return (process.env.NODE_ENV || 'development') === 'production';
}
