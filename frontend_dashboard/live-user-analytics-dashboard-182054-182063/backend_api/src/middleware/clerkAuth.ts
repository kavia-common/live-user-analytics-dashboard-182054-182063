import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { getEnv } from '../config/env.js';
import { debugError, debugLog } from '../utils/debug.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

declare global {
  // augment Express Request
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * clerkAuthMiddleware verifies Clerk JWT, attaches user with role resolved by ADMIN_EMAILS.
 * Returns 401 JSON on failure, never throws.
 */
export async function clerkAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const { ADMIN_EMAILS } = getEnv();
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    debugLog('clerk:auth', 'Verifying token', {
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: authHeader.split(' ')[0] || '',
      path: req.path,
      method: req.method,
      tokenLength: token ? token.length : 0,
    });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(token, token);
    
    if (!session || !session.userId) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session' });
    }

    // Fetch user details to get email
    const user = await clerkClient.users.getUser(session.userId);
    const email = user.emailAddresses?.[0]?.emailAddress || '';
    const role: 'admin' | 'user' =
      email && ADMIN_EMAILS.has(String(email).toLowerCase()) ? 'admin' : 'user';

    req.user = {
      id: session.userId,
      email: String(email || ''),
      role,
    };
    debugLog('clerk:auth', 'Authenticated via Clerk', { id: req.user.id, role: req.user.role });
    return next();
  } catch (err) {
    debugError('clerk:auth', 'Clerk verification failed', err, {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
