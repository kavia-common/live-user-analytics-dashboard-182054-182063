import mongoose from 'mongoose';
import { Namespace } from 'socket.io';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Session } from '../models/Session.js';
import { overviewStats } from '../services/statsService.js';

let activityStream: mongoose.ChangeStream | null = null;
let sessionStream: mongoose.ChangeStream | null = null;

/**
 * PUBLIC_INTERFACE
 * startChangeStreams attaches change streams on ActivityEvent and Session collections.
 * Emits:
 * - 'activity:new' when ActivityEvent inserted
 * - 'stats:update' minimal on session/activity changes (throttled approach can be added later)
 */
export async function startChangeStreams(realtime: Namespace) {
  const db = mongoose.connection;

  // ActivityEvent insert stream
  if (!activityStream) {
    activityStream = ActivityEvent.watch([], { fullDocument: 'updateLookup' });
    activityStream.on('change', async (change) => {
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
          // Also emit updated overview stats (simple approach)
          const stats = await overviewStats(60);
          realtime.emit('stats:update', stats);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Activity change stream handler error:', err);
      }
    });

    activityStream.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.error('Activity change stream error', e);
    });
  }

  // Session stream: on any change likely affecting active count or similar stats
  if (!sessionStream) {
    sessionStream = Session.watch([], { fullDocument: 'updateLookup' });
    sessionStream.on('change', async (_change) => {
      try {
        const stats = await overviewStats(60);
        realtime.emit('stats:update', stats);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Session change stream handler error:', err);
      }
    });

    sessionStream.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.error('Session change stream error', e);
    });
  }
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
