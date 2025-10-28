import { Request, Response, NextFunction } from 'express';
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node';
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
  const { ADMIN_EMAILS, CLERK_SECRET_KEY } = getEnv();
  
  if (!CLERK_SECRET_KEY) {
    debugLog('clerk:auth', 'No CLERK_SECRET_KEY configured');
    return res.status(401).json({ error: 'Unauthorized: Clerk not configured' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    debugLog('clerk:auth', 'Processing request', {
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: authHeader.split(' ')[0] || '',
      tokenLength: authHeader.startsWith('Bearer ') ? authHeader.substring(7).length : 0,
      path: req.path,
      method: req.method,
    });

    if (!authHeader.startsWith('Bearer ')) {
      debugLog('clerk:auth', 'No Bearer token - returning 401', { path: req.path });
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
    
    if (!payload || !payload.sub) {
      debugLog('clerk:auth', 'Invalid token - returning 401', { path: req.path });
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Get user details
    const user = await clerkClient.users.getUser(payload.sub);
    
    const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || '';
    const role: 'admin' | 'user' =
      email && ADMIN_EMAILS.has(String(email).toLowerCase()) ? 'admin' : 'user';

    req.user = {
      id: payload.sub,
      email: String(email || ''),
      role,
    };
    
    debugLog('clerk:auth', 'Authenticated via Clerk', { id: req.user.id, role: req.user.role });
    return next();
  } catch (err: any) {
    debugError('clerk:auth', 'Clerk verification failed', err, {
      path: req.path,
      method: req.method,
      errorMessage: err?.message,
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
