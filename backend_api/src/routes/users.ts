import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { listUsers, updateUserRole } from '../services/userService.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/users
 * Admin only - list users with pagination
 */
router.get('/', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const result = await listUsers(page, limit);
  return res.status(200).json(result);
});

/**
 * PUBLIC_INTERFACE
 * PATCH /api/users/:id/role
 * Admin only - update user role
 */
router.patch('/:id/role', authMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  const schema = Joi.object({
    role: Joi.string().valid('admin', 'user').required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const updated = await updateUserRole(req.params.id, value.role);
    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({ error: err.message || 'Error updating role' });
  }
});

export default router;
