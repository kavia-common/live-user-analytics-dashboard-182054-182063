import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { legacyJwtAuthMiddleware } from '../middleware/auth.js';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { login, signup } from '../services/authService.js';
import { logMongoStatus } from '../utils/debug.js';
import { getEnv } from '../config/env.js';

const router = Router();

// CORS preflight visibility for this router (debug only)
// PUBLIC_INTERFACE
router.options('*', (_req: Request, res: Response) => {
  return res.sendStatus(204);
});

const { LOCAL_JWT_AUTH } = getEnv();

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/signup
 * Local password-based auth only if LOCAL_JWT_AUTH=true; otherwise 404.
 */
router.post('/signup', async (req: Request, res: Response) => {
  if (!LOCAL_JWT_AUTH) return res.status(404).json({ error: 'Not Found' });
  res.set('Content-Type', 'application/json');
  logMongoStatus('auth:signup');

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().optional(),
    role: Joi.string().valid('admin', 'user').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const result = await signup(value);
    return res.status(201).json(result);
  } catch (err: any) {
    if (err?.code === 11000 || /E11000/i.test(String(err?.message))) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    return res.status(err?.statusCode || 500).json({ error: err?.message || 'Error creating user' });
  }
});

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/login
 * Local password-based auth only if LOCAL_JWT_AUTH=true; otherwise 404.
 */
router.post('/login', async (req: Request, res: Response) => {
  if (!LOCAL_JWT_AUTH) return res.status(404).json({ error: 'Not Found' });
  res.set('Content-Type', 'application/json');
  logMongoStatus('auth:login');

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const result = await login(value);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(err?.statusCode || 500).json({ error: err?.message || 'Error logging in' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/auth/me
 * Returns current user derived from Clerk token.
 */
router.get('/me', clerkAuthMiddleware, async (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json');
  return res.status(200).json({ user: req.user! });
});

export default router;
