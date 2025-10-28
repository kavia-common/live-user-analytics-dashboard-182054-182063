import mongoose from 'mongoose';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Session } from '../models/Session.js';

/**
 * PUBLIC_INTERFACE
 * overviewStats returns high-level counts for dashboard cards
 */
export async function overviewStats(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const [activeSessions, eventsCount, uniqueUsers] = await Promise.all([
    Session.countDocuments({ isActive: true }),
    ActivityEvent.countDocuments({ occurredAt: { $gte: since } }),
    ActivityEvent.distinct('userId', { occurredAt: { $gte: since }, userId: { $ne: null } }).then((arr) => arr.length),
  ]);
  return { activeSessions, eventsCount, uniqueUsers, windowMinutes: sinceMinutes };
}

/**
 * PUBLIC_INTERFACE
 * timeseriesStats returns per-interval counts over time
 */
export async function timeseriesStats(intervalMinutes = 5, totalMinutes = 60) {
  const since = new Date(Date.now() - totalMinutes * 60 * 1000);
  // Round timestamps by interval
  const pipeline: any[] = [
    { $match: { occurredAt: { $gte: since } } },
    {
      $group: {
        _id: {
          $toDate: {
            $subtract: [
              { $toLong: '$occurredAt' },
              { $mod: [{ $toLong: '$occurredAt' }, intervalMinutes * 60 * 1000] },
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];
  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({ ts: r._id, count: r.count }));
}

/**
 * PUBLIC_INTERFACE
 * deviceBreakdown aggregates by deviceType and browser
 */
export async function deviceBreakdown(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const pipeline: any[] = [
    { $match: { occurredAt: { $gte: since } } },
    {
      $group: {
        _id: { deviceType: '$device.deviceType', browser: '$device.browser' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ];
  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({
    deviceType: r._id.deviceType || 'unknown',
    browser: r._id.browser || 'unknown',
    count: r.count,
  }));
}

/**
 * PUBLIC_INTERFACE
 * locationBreakdown aggregates by country
 */
export async function locationBreakdown(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const pipeline: any[] = [
    { $match: { occurredAt: { $gte: since } } },
    { $group: { _id: '$location.country', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ];
  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({ country: r._id || 'unknown', count: r.count }));
}
