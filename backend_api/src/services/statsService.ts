import { ActivityEvent } from '../models/ActivityEvent.js';
import { Session } from '../models/Session.js';

/**
 * PUBLIC_INTERFACE
 * overviewStats returns high-level counts for dashboard cards
 * - totalUsers: unique users ever seen (by clerkUserId or email fallback)
 * - activeSessions: sessions currently active
 * - eventsCount: total events in the provided window
 * - uniqueUsers: unique users that generated events in the provided window
 */
export async function overviewStats(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

  // Distinct unique users overall based on Clerk id fallback to email
  const [activeSessions, eventsCount, uniqueUsersWindow, totalUsers] = await Promise.all([
    Session.countDocuments({ isActive: true }),
    ActivityEvent.countDocuments({ occurredAt: { $gte: since } }),
    ActivityEvent.distinct('clerkUserId', { occurredAt: { $gte: since }, clerkUserId: { $ne: null } }).then((arr) =>
      arr.length
    ),
    ActivityEvent.distinct('clerkUserId', { clerkUserId: { $ne: null } }).then((arr) => arr.length),
  ]);

  return {
    totalUsers,
    activeSessions,
    eventsCount,
    uniqueUsers: uniqueUsersWindow,
    windowMinutes: sinceMinutes,
  };
}

/**
 * PUBLIC_INTERFACE
 * timeseriesStats returns per-interval counts over time for events and unique users
 */
export async function timeseriesStats(intervalMinutes = 5, totalMinutes = 60) {
  const clampedInterval = Math.max(1, Math.min(60 * 24, Number(intervalMinutes) || 5));
  const clampedTotal = Math.max(clampedInterval, Math.min(60 * 24 * 7, Number(totalMinutes) || 60)); // up to 7 days

  const since = new Date(Date.now() - clampedTotal * 60 * 1000);

  const bucketMs = clampedInterval * 60 * 1000;

  // Helper expression to floor timestamps to bucket start
  const bucketExpr = {
    $toDate: {
      $subtract: [{ $toLong: '$occurredAt' }, { $mod: [{ $toLong: '$occurredAt' }, bucketMs] }],
    },
  };

  const pipeline = [
    { $match: { occurredAt: { $gte: since } } },
    {
      $group: {
        _id: bucketExpr,
        count: { $sum: 1 },
        // Collect a set of unique clerkUserIds per bucket
        users: { $addToSet: '$clerkUserId' },
      },
    },
    {
      $project: {
        _id: 1,
        count: 1,
        uniqueUsers: {
          $size: {
            $filter: {
              input: '$users',
              as: 'u',
              cond: { $ne: ['$$u', null] },
            },
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ] as any[];

  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({ ts: r._id, count: r.count, uniqueUsers: r.uniqueUsers }));
}

/**
 * PUBLIC_INTERFACE
 * deviceBreakdown aggregates by deviceType, os, and browser
 */
export async function deviceBreakdown(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const pipeline = [
    { $match: { occurredAt: { $gte: since } } },
    {
      $group: {
        _id: {
          deviceType: '$device.deviceType',
          os: '$device.os',
          browser: '$device.browser',
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 50 },
  ];
  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({
    deviceType: r._id.deviceType || 'unknown',
    os: r._id.os || 'unknown',
    browser: r._id.browser || 'unknown',
    count: r.count,
  }));
}

/**
 * PUBLIC_INTERFACE
 * locationBreakdown aggregates by country and region
 */
export async function locationBreakdown(sinceMinutes = 60) {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
  const pipeline = [
    { $match: { occurredAt: { $gte: since } } },
    {
      $group: {
        _id: { country: '$location.country', region: '$location.region' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 100 },
  ];
  const rows = await ActivityEvent.aggregate(pipeline);
  return rows.map((r) => ({
    country: r._id.country || 'unknown',
    region: r._id.region || 'unknown',
    count: r.count,
  }));
}
