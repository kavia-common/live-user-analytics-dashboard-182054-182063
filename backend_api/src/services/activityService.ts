import { ActivityEvent, IActivityEvent } from '../models/ActivityEvent.js';

/**
 * PUBLIC_INTERFACE
 * createActivity creates a new activity event
 */
export async function createActivity(input: Partial<IActivityEvent>) {
  const ev = new ActivityEvent({
    ...input,
    occurredAt: input.occurredAt || new Date(),
  });
  return ev.save();
}

/**
 * PUBLIC_INTERFACE
 * listRecentActivities returns last N activities
 */
export async function listRecentActivities(limit = 50) {
  const items = await ActivityEvent.find().sort({ occurredAt: -1 }).limit(limit);
  return items.map((a) => serializeActivity(a));
}

function serializeActivity(a: IActivityEvent) {
  return {
    id: a._id.toString(),
    userId: a.userId ? a.userId.toString() : null,
    sessionId: a.sessionId ? a.sessionId.toString() : null,
    type: a.type,
    page: a.page || null,
    device: a.device || {},
    location: a.location || {},
    metadata: a.metadata || {},
    occurredAt: a.occurredAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
