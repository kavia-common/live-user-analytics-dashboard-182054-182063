import { Router, Request, Response } from 'express';
import { clerkAuthMiddleware } from '../middleware/clerkAuth.js';
import { overviewStats, timeseriesStats, deviceBreakdown, locationBreakdown } from '../services/statsService.js';
import { debugError } from '../utils/debug.js';

const router = Router();

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/overview?sinceMinutes=60
 * Returns overview statistics (active sessions, events count, unique users).
 */
router.get('/overview', clerkAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
    const data = await overviewStats(sinceMinutes);
    return res.status(200).json(data);
  } catch (err) {
    debugError('stats:overview', 'Failed to compute overview', err);
    return res.status(500).json({ error: 'Failed to compute overview stats' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/timeseries?intervalMinutes=5&totalMinutes=60
 * Returns time-series data for activity over time.
 */
router.get('/timeseries', clerkAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const intervalMinutes = parseInt((req.query.intervalMinutes as string) || '5', 10);
    const totalMinutes = parseInt((req.query.totalMinutes as string) || '60', 10);
    const data = await timeseriesStats(intervalMinutes, totalMinutes);
    return res.status(200).json({ series: data });
  } catch (err) {
    debugError('stats:timeseries', 'Failed to compute timeseries', err);
    return res.status(500).json({ error: 'Failed to compute timeseries stats' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/devices?sinceMinutes=60
 * Returns device and browser breakdown statistics.
 */
router.get('/devices', clerkAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
    const data = await deviceBreakdown(sinceMinutes);
    return res.status(200).json({ devices: data });
  } catch (err) {
    debugError('stats:devices', 'Failed to compute device breakdown', err);
    return res.status(500).json({ error: 'Failed to compute device stats' });
  }
});

/**
 * PUBLIC_INTERFACE
 * GET /api/stats/locations?sinceMinutes=60
 * Returns location breakdown statistics by country.
 */
router.get('/locations', clerkAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const sinceMinutes = parseInt((req.query.sinceMinutes as string) || '60', 10);
    const data = await locationBreakdown(sinceMinutes);
    return res.status(200).json({ locations: data });
  } catch (err) {
    debugError('stats:locations', 'Failed to compute location breakdown', err);
    return res.status(500).json({ error: 'Failed to compute location stats' });
  }
});

export default router;
