import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware } from '../middleware/auth.js';
import { login, signup } from '../services/authService.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/signup
 * Body: { email, password, name?, role? }
 * Returns: { token, user }
 */
router.post('/signup', async (req: Request, res: Response) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().optional(),
    role: Joi.string().valid('admin', 'user').optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const result = await signup(value);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Error creating user' });
  }
});

/**
 * PUBLIC_INTERFACE
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 */
router.post('/login', async (req: Request, res: Response) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const result = await login(value);
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Error logging in' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns: { user } current user from JWT
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const user = req.user!;
  return res.status(200).json({ user });
});

export default router;
