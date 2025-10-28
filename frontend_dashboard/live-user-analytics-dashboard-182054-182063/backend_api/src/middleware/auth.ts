import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { debugLog, debugError } from '../utils/debug.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

declare global {
  // augment Express Request
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * PUBLIC_INTERFACE
 * legacyJwtAuthMiddleware verifies legacy JWT and attaches user (used only when LOCAL_JWT_AUTH=true).
 */
export function legacyJwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const { JWT_SECRET } = getEnv();
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;

    debugLog('jwt:verify', 'Verifying token', {
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: (req.headers.authorization || '').split(' ')[0] || '',
      tokenLength: token ? token.length : 0,
      path: req.path,
      method: req.method,
    });

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const payload = jwt.verify(token, JWT_SECRET) as AuthUser & { iat: number; exp: number };
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    debugLog('jwt:verify', 'Token OK', { user: req.user });
    return next();
  } catch (err) {
    debugError('jwt:verify', 'Token verify failed', err, {
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

/**
 * PUBLIC_INTERFACE
 * requireRole ensures the authenticated user has one of the allowed roles
 */
export function requireRole(...roles: Array<'admin' | 'user'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      debugLog('auth:role', 'Forbidden due to role mismatch', {
        required: roles,
        actual: req.user.role,
      });
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    return next();
  };
}
