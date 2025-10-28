import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireRole } from '../middleware/auth.js';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { createActivity, listRecentActivities } from '../services/activityService.js';
import { debugLog } from '../utils/debug.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/activities/recent?limit=50
 * Auth required - returns recent activity events
 */
router.get('/recent', clerkAuthMiddleware, async (req: Request, res: Response) => {
  debugLog('activities:recent', 'Request start', {
    user: req.user,
    authHeaderPresent: !!req.headers.authorization,
  });
  const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);
  const items = await listRecentActivities(limit);
  debugLog('activities:recent', 'Returning items', { count: items.length, limit });
  return res.status(200).json({ items });
});

/**
 * PUBLIC_INTERFACE
 * POST /api/activities
 * Admin only - creates a synthetic activity (useful for testing)
 */
router.post('/', clerkAuthMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  debugLog('activities:create', 'Request start', {
    user: req.user,
    authHeaderPresent: !!req.headers.authorization,
  });

  const schema = Joi.object({
    userId: Joi.string().optional().allow(null, ''),
    sessionId: Joi.string().optional().allow(null, ''),
    type: Joi.string().valid('login', 'logout', 'page_view', 'click', 'navigation').required(),
    page: Joi.string().optional(),
    device: Joi.object({
      os: Joi.string().optional(),
      browser: Joi.string().optional(),
      deviceType: Joi.string().optional(),
    }).optional(),
    location: Joi.object({
      country: Joi.string().optional(),
      region: Joi.string().optional(),
      city: Joi.string().optional(),
      lat: Joi.number().optional(),
      lon: Joi.number().optional(),
    }).optional(),
    metadata: Joi.object().optional(),
    occurredAt: Joi.date().optional(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const created = await createActivity(value as any);
    debugLog('activities:create', 'Created', { id: created._id.toString() });
    return res.status(201).json({ id: created._id.toString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error creating activity' });
  }
});

export default router;
