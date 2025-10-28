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
router.get('/recent', clerkAuthMiddleware, async (_req: Request, res: Response) => {
  const limit = Math.min(parseInt((_req.query.limit as string) || '50', 10), 200);
  const items = await listRecentActivities(limit);
  debugLog('activities:recent', 'Returning items', { count: items.length, limit });
  return res.status(200).json({ items });
});

/**
 * PUBLIC_INTERFACE
 * POST /api/activity
 * Authenticated users can post their own activity events (login, page_view, etc.)
 * This is the main endpoint for frontend to track user activity.
 */
router.post('/activity', clerkAuthMiddleware, async (req: Request, res: Response) => {
  debugLog('activities:activity', 'Request start', {
    user: req.user,
    authHeaderPresent: !!req.headers.authorization,
  });

  const schema = Joi.object({
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
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    // Auto-populate userId from authenticated user
    const payload = {
      ...value,
      userId: req.user?.id || null,
      occurredAt: new Date(),
    };
    const created = await createActivity(payload as any);
    debugLog('activities:activity', 'Created', { id: created._id.toString() });
    return res.status(201).json({ id: created._id.toString() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error creating activity' });
  }
});

/**
 * PUBLIC_INTERFACE
 * POST /api/activities
 * Creates an activity event. Auth required. Admin check removed to allow user activity tracking.
 */
router.post('/', clerkAuthMiddleware, async (req: Request, res: Response) => {
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
    debugLog('activities:create', 'Created', { id: created._id.toString(), type: value.type });
    return res.status(204).send();
  } catch (err: any) {
    debugLog('activities:create', 'Error', { error: err.message });
    return res.status(500).json({ error: err.message || 'Error creating activity' });
  }
});

export default router;
