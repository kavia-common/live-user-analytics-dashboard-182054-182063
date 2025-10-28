import { getEnv } from './env.js';

/**
 * PUBLIC_INTERFACE
 * initializeClerk sets up Clerk backend SDK configuration.
 * Must be called before any Clerk middleware is used.
 */
export function initializeClerk() {
  const { CLERK_SECRET_KEY } = getEnv();
  
  if (CLERK_SECRET_KEY) {
    // Set the Clerk secret key for @clerk/clerk-sdk-node
    process.env.CLERK_SECRET_KEY = CLERK_SECRET_KEY;
  } else {
    // eslint-disable-next-line no-console
    console.warn('[Clerk] CLERK_SECRET_KEY not set. Clerk authentication will not work.');
  }
}
