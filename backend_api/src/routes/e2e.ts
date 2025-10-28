import { Router, Request, Response } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { debugLog } from '../utils/debug.js';

// This router provides minimal endpoints for e2e verification and a DEV-only in-memory auth fallback.
// It is safe: only active in development for auth fallback; health check is always available.

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/e2e/health
 * Returns 200 JSON to validate API reachability and JSON Content-Type settings.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.type('application/json');
  return res.status(200).json({
    status: 'ok',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// DEV-only in-memory auth fallback to isolate DB issues in single-host mode.
const memoryUsers: Record<string, { id: string; email: string; name?: string; role: 'admin' | 'user'; password: string }> = {};
let nextId = 1;

/**
 * PUBLIC_INTERFACE
 * POST /api/e2e/dev/signup
 * Active only when NODE_ENV=development. Stores users in memory and returns JWT.
 * Body: { email, password, name?, role? }
 * Response: { token, user }
 */
router.post('/dev/signup', (req: Request, res: Response) => {
  const { NODE_ENV, JWT_SECRET } = getEnv();
  if (NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.type('application/json');

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().optional(),
    role: Joi.string().valid('admin', 'user').optional(),
  });
  const { error, value } = schema.validate(req.body);
  debugLog('e2e:dev:signup', 'Validate', { valid: !error, email: value?.email, pl: value?.password?.length });
  if (error) return res.status(400).json({ error: error.message });

  if (memoryUsers[value.email]) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const id = String(nextId++);
  memoryUsers[value.email] = {
    id,
    email: value.email,
    name: value.name,
    role: value.role || 'user',
    password: value.password, // dev-only plain for speed; not persisted
  };
  const token = jwt.sign({ id, email: value.email, role: memoryUsers[value.email].role }, JWT_SECRET, { expiresIn: '12h' });
  debugLog('e2e:dev:signup', 'Created mem user and signed token', { id, tokenLength: token.length });

  return res.status(201).json({
    token,
    user: {
      id,
      email: value.email,
      name: value.name || '',
      role: memoryUsers[value.email].role,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
});

/**
 * PUBLIC_INTERFACE
 * POST /api/e2e/dev/login
 * Active only when NODE_ENV=development. Authenticates against in-memory users.
 * Body: { email, password } -> { token, user }
 */
router.post('/dev/login', (req: Request, res: Response) => {
  const { NODE_ENV, JWT_SECRET } = getEnv();
  if (NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not Found' });
  }
  res.type('application/json');

  const schema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  debugLog('e2e:dev:login', 'Validate', { valid: !error, email: value?.email });
  if (error) return res.status(400).json({ error: error.message });

  const u = memoryUsers[value.email];
  if (!u || u.password !== value.password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '12h' });
  debugLog('e2e:dev:login', 'Mem login OK', { id: u.id, tokenLength: token.length });

  return res.status(200).json({
    token,
    user: {
      id: u.id,
      email: u.email,
      name: u.name || '',
      role: u.role,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });
});

export default router;
