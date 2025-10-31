import { Router, Request, Response } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { overviewStats, timeseriesStats, deviceBreakdown, locationBreakdown } from '../services/statsService.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/overview?sinceMinutes=60
 * Returns overall KPIs for the dashboard cards.
 */
router.get('/overview', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = Number.parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await overviewStats(Number.isFinite(sinceMinutes) ? sinceMinutes : 60);
  return res.status(200).json(data);
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/timeseries?intervalMinutes=5&totalMinutes=60
 * Returns array of buckets with { ts, count, uniqueUsers } for the given window.
 */
router.get('/timeseries', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const intervalMinutes = Number.parseInt((req.query.intervalMinutes as string) || '5', 10);
  const totalMinutes = Number.parseInt((req.query.totalMinutes as string) || '60', 10);
  const data = await timeseriesStats(intervalMinutes, totalMinutes);
  return res.status(200).json({ series: data, intervalMinutes: intervalMinutes || 5, totalMinutes: totalMinutes || 60 });
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/devices?sinceMinutes=60
 * Returns device breakdown by deviceType, os, and browser.
 */
router.get('/devices', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = Number.parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await deviceBreakdown(sinceMinutes);
  return res.status(200).json({ devices: data, windowMinutes: sinceMinutes || 60 });
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/locations?sinceMinutes=60
 * Returns locations breakdown by country and region.
 */
router.get('/locations', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = Number.parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await locationBreakdown(sinceMinutes);
  return res.status(200).json({ locations: data, windowMinutes: sinceMinutes || 60 });
});

export default router;
