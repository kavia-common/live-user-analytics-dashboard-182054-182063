import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { login, signup } from '../services/authService.js';
import { debugLog, debugError, logMongoStatus } from '../utils/debug.js';

const router = Router();

// CORS preflight visibility for this router (debug only)
router.options('*', (req: Request, res: Response) => {
  debugLog('auth:cors', 'OPTIONS preflight', {
    path: req.path,
    headers: {
      origin: req.headers.origin,
      'access-control-request-method': req.headers['access-control-request-method'],
      'access-control-request-headers': req.headers['access-control-request-headers'],
    },
  });
  return res.sendStatus(204);
});

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/signup
 * Body: { email, password, name?, role? }
 * Returns: { token, user }
 */
router.post('/signup', async (req: Request, res: Response) => {
  // Always return JSON from this router
  res.set('Content-Type', 'application/json');

  debugLog('auth:signup', 'Incoming request', {
    method: req.method,
    path: req.path,
    hasBody: !!req.body,
    contentType: req.headers['content-type'] || '',
  });
  logMongoStatus('auth:signup');

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().optional(),
    role: Joi.string().valid('admin', 'user').optional(),
  });

  const { error, value } = schema.validate(req.body);
  debugLog('auth:signup', 'Validation result', {
    valid: !error,
    email: value?.email,
    name: value?.name,
    role: value?.role,
    passwordLength: value?.password ? String(value.password).length : undefined,
  });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const result = await signup(value);
    debugLog('auth:signup', 'Signup success', {
      userId: result.user?.id,
      tokenLength: result.token?.length,
      status: 201,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    // Duplicate key error (e.g., email unique)
    if (err?.code === 11000 || /E11000/i.test(String(err?.message))) {
      debugError('auth:signup', 'Duplicate email detected', err, { email: value?.email });
      return res.status(400).json({ error: 'Email already in use' });
    }
    debugError('auth:signup', 'Signup failed', err, {
      email: value?.email,
      name: value?.name,
      hasStack: !!err?.stack,
    });
    return res.status(err?.statusCode || 500).json({ error: err?.message || 'Error creating user' });
  }
});

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/register
 * Alias of signup for frontend compatibility.
 */
router.post('/register', async (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json');

  debugLog('auth:register', 'Alias invoked → forwarding to signup handler');
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().optional(),
    role: Joi.string().valid('admin', 'user').optional(),
  });
  const { error, value } = schema.validate(req.body);
  debugLog('auth:register', 'Validation result', {
    valid: !error,
    email: value?.email,
    name: value?.name,
    role: value?.role,
    passwordLength: value?.password ? String(value.password).length : undefined,
  });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  logMongoStatus('auth:register');
  try {
    const result = await signup(value);
    debugLog('auth:register', 'Register success', {
      userId: result.user?.id,
      tokenLength: result.token?.length,
      status: 201,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    if (err?.code === 11000 || /E11000/i.test(String(err?.message))) {
      debugError('auth:register', 'Duplicate email detected', err, { email: value?.email });
      return res.status(400).json({ error: 'Email already in use' });
    }
    debugError('auth:register', 'Register failed', err, { email: value?.email });
    return res.status(err?.statusCode || 500).json({ error: err?.message || 'Error creating user' });
  }
});

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post('/login', async (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json');

  debugLog('auth:login', 'Incoming request', {
    method: req.method,
    path: req.path,
    hasBody: !!req.body,
    contentType: req.headers['content-type'] || '',
  });
  logMongoStatus('auth:login');

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  debugLog('auth:login', 'Validation result', {
    valid: !error,
    email: value?.email,
    passwordLength: value?.password ? String(value.password).length : undefined,
  });
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const result = await login(value);
    debugLog('auth:login', 'Login success', {
      userId: result.user?.id,
      tokenLength: result.token?.length,
      status: 200,
    });
    return res.status(200).json(result);
  } catch (err: any) {
    debugError('auth:login', 'Login failed', err, { email: value?.email });
    return res.status(err?.statusCode || 500).json({ error: err?.message || 'Error logging in' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns: { user } current user from JWT (derived from token, not DB lookup)
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  res.set('Content-Type', 'application/json');

  debugLog('auth:me', 'JWT verified via middleware', {
    path: req.path,
    hasAuthHeader: !!req.headers.authorization,
    authHeaderPrefix: (req.headers.authorization || '').split(' ')[0] || '',
    user: req.user,
  });
  const user = req.user!;
  return res.status(200).json({ user });
});

export default router;
