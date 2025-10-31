import mongoose from 'mongoose';
import { Namespace } from 'socket.io';
import { ActivityEvent } from '../models/ActivityEvent.js';
import { Session } from '../models/Session.js';
import { overviewStats } from '../services/statsService.js';
import { debugError, debugLog } from '../utils/debug.js';

let activityStream: mongoose.ChangeStream | null = null;
let sessionStream: mongoose.ChangeStream | null = null;

// Keep last resume tokens in-memory to resume after errors or reconnects
let lastActivityResumeToken: mongoose.ResumeToken | undefined;
let lastSessionResumeToken: mongoose.ResumeToken | undefined;

// helper to open a change stream with resume token and robust listeners
function openActivityStream(realtime: Namespace) {
  const options: mongoose.ChangeStreamOptions = { fullDocument: 'updateLookup' };
  if (lastActivityResumeToken) {
    // @ts-expect-error mongoose types allow resumeAfter in driver options
    (options as any).resumeAfter = lastActivityResumeToken;
  }

  activityStream = ActivityEvent.watch([], options);

  activityStream.on('change', async (change) => {
    try {
      // Save resume token for next resume
      if (change && (change as any)._id) {
        lastActivityResumeToken = (change as any)._id;
      }

      if (change.operationType === 'insert') {
        const full: any = change.fullDocument;
        realtime.emit('activity:new', {
          id: full._id?.toString?.() || String(full._id),
          userId: full.userId ? String(full.userId) : null,
          sessionId: full.sessionId ? String(full.sessionId) : null,
          type: full.type,
          page: full.page || full.path || null,
          device: full.device || {},
          location: full.location || {},
          occurredAt: full.occurredAt,
          createdAt: full.createdAt,
        });

        // Emit a lightweight stats update (last 60 mins)
        try {
          const stats = await overviewStats(60);
          realtime.emit('stats:update', stats);
        } catch (aggErr) {
          debugError('changestreams:activity:stats', 'Failed to compute overview stats', aggErr);
        }
      } else if (change.operationType === 'update' || change.operationType === 'replace' || change.operationType === 'delete') {
        // Non-insert operations can still affect stats; emit minimal update
        try {
          const stats = await overviewStats(60);
          realtime.emit('stats:update', stats);
        } catch (aggErr) {
          debugError('changestreams:activity:stats2', 'Failed to compute overview stats', aggErr);
        }
      }
    } catch (err) {
      debugError('changestreams:activity', 'Handler error', err);
    }
  });

  activityStream.on('error', (e) => {
    debugError('changestreams:activity', 'Stream error; will attempt to resume', e, {
      hasResumeToken: !!lastActivityResumeToken,
    });
    safeRestartActivityStream(realtime);
  });

  activityStream.on('end', () => {
    debugLog('changestreams:activity', 'Stream ended; attempting to re-open', {
      hasResumeToken: !!lastActivityResumeToken,
    });
    safeRestartActivityStream(realtime);
  });
}

function safeRestartActivityStream(realtime: Namespace) {
  try {
    if (activityStream) {
      // do not await here to avoid blocking handlers
      activityStream.close().catch(() => {});
      activityStream = null;
    }
  } catch (_) {
    // ignore
  }
  // slight delay to avoid hot-loop on transient failures
  setTimeout(() => {
    try {
      openActivityStream(realtime);
    } catch (err) {
      debugError('changestreams:activity', 'Failed to reopen stream', err);
    }
  }, 500);
}

function openSessionStream(realtime: Namespace) {
  const options: mongoose.ChangeStreamOptions = { fullDocument: 'updateLookup' };
  if (lastSessionResumeToken) {
    // @ts-expect-error driver option passthrough
    (options as any).resumeAfter = lastSessionResumeToken;
  }

  sessionStream = Session.watch([], options);

  sessionStream.on('change', async (change) => {
    try {
      if (change && (change as any)._id) {
        lastSessionResumeToken = (change as any)._id;
      }
      // Any session change likely affects active counts; emit updated overview stats
      try {
        const stats = await overviewStats(60);
        realtime.emit('stats:update', stats);
      } catch (aggErr) {
        debugError('changestreams:session:stats', 'Failed to compute overview stats', aggErr);
      }
    } catch (err) {
      debugError('changestreams:session', 'Handler error', err);
    }
  });

  sessionStream.on('error', (e) => {
    debugError('changestreams:session', 'Stream error; will attempt to resume', e, {
      hasResumeToken: !!lastSessionResumeToken,
    });
    safeRestartSessionStream(realtime);
  });

  sessionStream.on('end', () => {
    debugLog('changestreams:session', 'Stream ended; attempting to re-open', {
      hasResumeToken: !!lastSessionResumeToken,
    });
    safeRestartSessionStream(realtime);
  });
}

function safeRestartSessionStream(realtime: Namespace) {
  try {
    if (sessionStream) {
      sessionStream.close().catch(() => {});
      sessionStream = null;
    }
  } catch (_) {
    // ignore
  }
  setTimeout(() => {
    try {
      openSessionStream(realtime);
    } catch (err) {
      debugError('changestreams:session', 'Failed to reopen stream', err);
    }
  }, 500);
}

/**
 * PUBLIC_INTERFACE
 * startChangeStreams attaches change streams on ActivityEvent and Session collections.
 * Emits:
 * - 'activity:new' when ActivityEvent inserted
 * - 'stats:update' minimal on session/activity changes (throttled approach can be added later)
 */
export async function startChangeStreams(realtime: Namespace) {
  // Ensure we have a connected client; mongoose.connection.readyState === 1 means connected
  if (mongoose.connection.readyState !== 1) {
    debugError('changestreams', 'Attempted to start change streams without active Mongo connection');
    throw new Error('Mongo not connected');
  }

  if (!activityStream) {
    openActivityStream(realtime);
    debugLog('changestreams:activity', 'ActivityEvent change stream started');
  }
  if (!sessionStream) {
    openSessionStream(realtime);
    debugLog('changestreams:session', 'Session change stream started');
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
    debugError('changestreams', 'Error closing change streams', err);
  }
}
