import { Router, Request, Response } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { overviewStats, timeseriesStats, deviceBreakdown, locationBreakdown } from '../services/statsService.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/overview?sinceMinutes=60
 */
router.get('/overview', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await overviewStats(sinceMinutes);
  return res.status(200).json(data);
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/timeseries?intervalMinutes=5&totalMinutes=60
 */
router.get('/timeseries', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const intervalMinutes = parseInt((req.query.intervalMinutes as string) || '5', 10);
  const totalMinutes = parseInt((req.query.totalMinutes as string) || '60', 10);
  const data = await timeseriesStats(intervalMinutes, totalMinutes);
  return res.status(200).json({ series: data });
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/devices?sinceMinutes=60
 */
router.get('/devices', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await deviceBreakdown(sinceMinutes);
  return res.status(200).json({ devices: data });
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/locations?sinceMinutes=60
 */
router.get('/locations', clerkAuthMiddleware, async (req: Request, res: Response) => {
  const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
  const data = await locationBreakdown(sinceMinutes);
  return res.status(200).json({ locations: data });
});

export default router;
