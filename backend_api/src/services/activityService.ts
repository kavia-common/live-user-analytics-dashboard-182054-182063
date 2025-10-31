import { ActivityEvent, IActivityEvent } from '../models/ActivityEvent.js';
import { Session, ISession } from '../models/Session.js';

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
 * Normalize device, location, and basic fields into consistent shapes.
 */
export function normalizeDevice(input: any = {}) {
  return {
    ua: input.ua ?? input.userAgent ?? null,
    os: input.os || null,
    browser: input.browser || null,
    deviceType: input.deviceType || input.type || null,
  };
}

export function normalizeLocation(input: any = {}) {
  return {
    ip: input.ip || null,
    country: input.country || null,
    region: input.region || null,
    city: input.city || null,
    lat: typeof input.lat === 'number' ? input.lat : undefined,
    lon: typeof input.lon === 'number' ? input.lon : undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * listRecentActivities returns last N activities
 */
export async function listRecentActivities(limit = 50) {
  const items = await ActivityEvent.find().sort({ occurredAt: -1 }).limit(limit);
  return items.map((a) => serializeActivity(a));
}

/**
 * PUBLIC_INTERFACE
 * trackEvent handles session events (session_start/session_end/login) and page_view events.
 * - For session_start/login: upsert or create a new active session.
 * - For session_end: mark matching session inactive with endedAt.
 * - For page_view: insert an ActivityEvent linked to the session when provided.
 */
export async function trackEvent(params: {
  userId?: string | null;
  email?: string | null;
  clerkUserId?: string | null;
  type: 'page_view' | 'login' | 'session_start' | 'session_end';
  timestamp?: Date | string | number;
  sessionId?: string | null;
  device?: { ua?: string | null; os?: string; browser?: string; deviceType?: string | null } | any;
  location?: { ip?: string | null; country?: string; region?: string; city?: string; lat?: number; lon?: number } | any;
  path?: string | null;
  referrer?: string | null;
  extra?: Record<string, any> | null;
}) {
  const occurredAt = params.timestamp ? new Date(params.timestamp) : new Date();
  const device = normalizeDevice(params.device);
  const location = normalizeLocation(params.location);

  // Session management
  if (params.type === 'session_start' || params.type === 'login') {
    // If sessionId provided, attempt to update it; otherwise create a new active session
    let sessionDoc: ISession | null = null;
    if (params.sessionId) {
      sessionDoc = await Session.findByIdAndUpdate(
        params.sessionId,
        {
          $set: {
            isActive: true,
            endedAt: null,
            // snapshot fields
            clerkUserId: params.clerkUserId || null,
            email: params.email || null,
            ip: location.ip || null,
            userAgent: device.ua || null,
            device,
            location,
            path: params.path || null,
            referrer: params.referrer || null,
          },
          $setOnInsert: {
            startedAt: occurredAt,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      sessionDoc = await Session.create({
        userId: null, // optional linkage to local user model if used
        clerkUserId: params.clerkUserId || null,
        email: params.email || null,
        ip: location.ip || null,
        userAgent: device.ua || null,
        device,
        location,
        path: params.path || null,
        referrer: params.referrer || null,
        startedAt: occurredAt,
        endedAt: null,
        isActive: true,
      });
    }

    // Optionally record a corresponding activity event (e.g., login or session_start)
    await ActivityEvent.create({
      userId: null,
      clerkUserId: params.clerkUserId || null,
      email: params.email || null,
      sessionId: sessionDoc?._id || null,
      type: params.type,
      page: params.path || null,
      path: params.path || null,
      referrer: params.referrer || null,
      device,
      location,
      extra: params.extra || null,
      occurredAt,
    });

    return {
      session: serializeSession(sessionDoc!),
    };
  }

  if (params.type === 'session_end') {
    if (params.sessionId) {
      const sessionDoc = await Session.findByIdAndUpdate(
        params.sessionId,
        { $set: { isActive: false, endedAt: occurredAt } },
        { new: true }
      );
      await ActivityEvent.create({
        userId: null,
        clerkUserId: params.clerkUserId || null,
        email: params.email || null,
        sessionId: sessionDoc?._id || null,
        type: 'session_end',
        page: params.path || null,
        path: params.path || null,
        referrer: params.referrer || null,
        device,
        location,
        extra: params.extra || null,
        occurredAt,
      });
      return { session: sessionDoc ? serializeSession(sessionDoc) : null };
    }
    // If no session id, just record the event
    await ActivityEvent.create({
      userId: null,
      clerkUserId: params.clerkUserId || null,
      email: params.email || null,
      sessionId: null,
      type: 'session_end',
      page: params.path || null,
      path: params.path || null,
      referrer: params.referrer || null,
      device,
      location,
      extra: params.extra || null,
      occurredAt,
    });
    return { session: null };
  }

  // Default: page_view
  const created = await ActivityEvent.create({
    userId: null,
    clerkUserId: params.clerkUserId || null,
    email: params.email || null,
    sessionId: params.sessionId ? (params.sessionId as any) : null,
    type: 'page_view',
    page: params.path || null,
    path: params.path || null,
    referrer: params.referrer || null,
    device,
    location,
    extra: params.extra || null,
    occurredAt,
  });

  return { activity: serializeActivity(created) };
}

function serializeActivity(a: IActivityEvent) {
  return {
    id: a._id.toString(),
    userId: a.userId ? a.userId.toString() : null,
    clerkUserId: a.clerkUserId || null,
    email: a.email || null,
    sessionId: a.sessionId ? a.sessionId.toString() : null,
    type: a.type,
    page: a.page || a.path || null,
    path: a.path || null,
    referrer: a.referrer || null,
    device: a.device || {},
    location: a.location || {},
    metadata: a.metadata || {},
    extra: a.extra || null,
    occurredAt: a.occurredAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function serializeSession(s: ISession) {
  return {
    id: s._id.toString(),
    userId: s.userId ? s.userId.toString() : null,
    clerkUserId: s.clerkUserId || null,
    email: s.email || null,
    ip: s.ip || null,
    userAgent: s.userAgent || null,
    device: s.device || {},
    location: s.location || {},
    path: s.path || null,
    referrer: s.referrer || null,
    startedAt: s.startedAt,
    endedAt: s.endedAt || null,
    isActive: s.isActive,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
