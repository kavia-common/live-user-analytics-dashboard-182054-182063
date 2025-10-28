import { Router, Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { requireRole } from '../middleware/auth.js';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { createActivity, listRecentActivities } from '../services/activityService.js';
import { debugLog } from '../utils/debug.js';
import { Session } from '../models/Session.js';

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

/**
 * PUBLIC_INTERFACE
 * POST /api/activities/seed
 * Admin only - seeds a sample session and multiple activity events for testing aggregations.
 * Returns counts and IDs so clients can verify data and re-run stats endpoints immediately.
 */
router.post('/seed', clerkAuthMiddleware, requireRole('admin'), async (req: Request, res: Response) => {
  debugLog('activities:seed', 'Seeding sample data', {
    user: req.user,
  });

  try {
    // Create a sample session (active)
    const now = new Date();
    const session = await Session.create({
      userId: null,
      ip: '127.0.0.1',
      userAgent: 'SeedBot/1.0',
      device: { os: 'Linux', browser: 'Chrome', deviceType: 'desktop' },
      location: { country: 'US', region: 'CA', city: 'San Francisco', lat: 37.7749, lon: -122.4194 },
      startedAt: new Date(now.getTime() - 10 * 60 * 1000),
      endedAt: null,
      isActive: true,
    });

    // Create a batch of activity events over last hour
    const basePages = ['/', '/dashboard', '/settings', '/users'];
    const deviceCombos = [
      { os: 'Linux', browser: 'Chrome', deviceType: 'desktop' },
      { os: 'iOS', browser: 'Safari', deviceType: 'mobile' },
      { os: 'Android', browser: 'Chrome', deviceType: 'mobile' },
      { os: 'Windows', browser: 'Edge', deviceType: 'desktop' },
    ];
    const locations = [
      { country: 'US', region: 'CA', city: 'San Francisco' },
      { country: 'DE', region: 'BE', city: 'Berlin' },
      { country: 'IN', region: 'KA', city: 'Bengaluru' },
      { country: 'BR', region: 'SP', city: 'São Paulo' },
    ];

    const eventsPayload = [];
    for (let i = 0; i < 24; i++) {
      const occurredAt = new Date(now.getTime() - i * 5 * 60 * 1000); // every 5 minutes
      const device = deviceCombos[i % deviceCombos.length];
      const location = locations[i % locations.length];
      eventsPayload.push(
        {
          sessionId: session._id,
          type: i % 12 === 0 ? 'login' : 'page_view',
          page: basePages[i % basePages.length],
          device,
          location,
          metadata: { idx: i },
          occurredAt,
        },
        {
          sessionId: session._id,
          type: 'click',
          page: basePages[(i + 1) % basePages.length],
          device,
          location,
          metadata: { button: 'seed-action', idx: i },
          occurredAt: new Date(occurredAt.getTime() + 60 * 1000),
        }
      );
    }

    const created = await Promise.all(eventsPayload.map((payload) => createActivity(payload as any)));

    return res.status(201).json({
      sessionId: session._id.toString(),
      createdEvents: created.length,
      hint: 'Now call /api/stats/overview, /api/stats/timeseries, /api/stats/devices, /api/stats/locations, or /api/activities/recent',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error seeding sample data' });
  }
});

export default router;
