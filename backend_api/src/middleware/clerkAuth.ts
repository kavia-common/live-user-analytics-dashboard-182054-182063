import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/clerk-sdk-node';
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
    // getAuth reads the Authorization Bearer token from the request headers
    const auth = getAuth(req as any);
    debugLog('clerk:auth', 'getAuth() called', {
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: (req.headers.authorization || '').split(' ')[0] || '',
      path: req.path,
      method: req.method,
      hasUserId: !!auth?.userId,
      sid: auth?.sessionId || '',
    });
    if (!auth?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const email =
      (auth.sessionClaims as any)?.email ||
      (auth.sessionClaims as any)?.primary_email ||
      '';
    const role: 'admin' | 'user' =
      email && ADMIN_EMAILS.has(String(email).toLowerCase()) ? 'admin' : 'user';

    req.user = {
      id: auth.userId,
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
