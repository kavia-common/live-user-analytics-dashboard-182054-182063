import mongoose from 'mongoose';
import { Namespace } from 'socket.io';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Session } from '../models/Session.js';
import { overviewStats, timeseriesStats, deviceBreakdown, locationBreakdown } from '../services/statsService.js';

let activityStream: any = null;
let sessionStream: any = null;

/**
 * PUBLIC_INTERFACE
 * startChangeStreams attaches change streams on ActivityEvent and Session collections.
 * Emits:
 * - 'activity:new' when ActivityEvent inserted
 * - 'stats:update' with overview, timeseries, devices, and locations on changes
 */
export async function startChangeStreams(realtime: Namespace) {
  const db = mongoose.connection;

  // ActivityEvent insert stream
  if (!activityStream) {
    activityStream = ActivityEvent.watch([], { fullDocument: 'updateLookup' });
    activityStream.on('change', async (change: any) => {
      try {
        if (change.operationType === 'insert') {
          const full = change.fullDocument;
          realtime.emit('activity:new', {
            id: full._id.toString(),
            userId: full.userId ? full.userId.toString() : null,
            sessionId: full.sessionId ? full.sessionId.toString() : null,
            type: full.type,
            page: full.page || null,
            device: full.device || {},
            location: full.location || {},
            occurredAt: full.occurredAt,
            createdAt: full.createdAt,
          });
          // Emit comprehensive stats update
          await emitStatsUpdate(realtime);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Activity change stream handler error:', err);
      }
    });

    activityStream.on('error', (e: any) => {
      // eslint-disable-next-line no-console
      console.error('Activity change stream error', e);
    });
  }

  // Session stream: on any change likely affecting active count or similar stats
  if (!sessionStream) {
    sessionStream = Session.watch([], { fullDocument: 'updateLookup' });
    sessionStream.on('change', async (_change: any) => {
      try {
        await emitStatsUpdate(realtime);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Session change stream handler error:', err);
      }
    });

    sessionStream.on('error', (e: any) => {
      // eslint-disable-next-line no-console
      console.error('Session change stream error', e);
    });
  }
}

/**
 * Compute and emit comprehensive stats update to all connected clients.
 */
async function emitStatsUpdate(realtime: Namespace) {
  const [overview, timeseries, devices, locations] = await Promise.all([
    overviewStats(60),
    timeseriesStats(5, 60),
    deviceBreakdown(60),
    locationBreakdown(60),
  ]);
  realtime.emit('stats:update', {
    overview,
    timeseries,
    devices,
    locations,
  });
}

/**
 * PUBLIC_INTERFACE
 * stopChangeStreams closes open change streams.
 */
export async function stopChangeStreams() {
  try {
    if (activityStream) {
      await activityStream.close();
      activityStream = null;
    }
    if (sessionStream) {
      await sessionStream.close();
      sessionStream = null;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error closing change streams:', err);
  }
}
