import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ActivityType = 'login' | 'logout' | 'page_view' | 'click' | 'navigation' | 'session_start' | 'session_end';

export interface IActivityEvent extends Document {
  userId?: Types.ObjectId | null;
  // When using Clerk, we also store raw Clerk user id/email snapshot for analytics joins
  clerkUserId?: string | null;
  email?: string | null;

  sessionId?: Types.ObjectId | null;
  type: ActivityType;

  // Path/page info
  page?: string;
  path?: string | null;
  referrer?: string | null;

  // Device info
  device?: {
    ua?: string | null;
    os?: string;
    browser?: string;
    deviceType?: string; // desktop, mobile, tablet
  };

  // Location info
  location?: {
    ip?: string | null;
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };

  // Extra arbitrary data
  metadata?: Record<string, any>;
  extra?: Record<string, any> | null;

  // Timestamps
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    clerkUserId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true },

    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', index: true },
    type: {
      type: String,
      required: true,
      enum: ['login', 'logout', 'page_view', 'click', 'navigation', 'session_start', 'session_end'],
      index: true,
    },

    page: { type: String, index: true },
    path: { type: String, index: true },
    referrer: { type: String },

    device: {
      ua: { type: String },
      os: { type: String },
      browser: { type: String, index: true },
      deviceType: { type: String, index: true },
    },

    location: {
      ip: { type: String, index: true },
      country: { type: String, index: true },
      region: { type: String },
      city: { type: String },
      lat: { type: Number },
      lon: { type: Number },
    },

    metadata: { type: Schema.Types.Mixed },
    extra: { type: Schema.Types.Mixed },

    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Time-series oriented indexes
ActivityEventSchema.index({ occurredAt: -1 });
ActivityEventSchema.index({ type: 1, occurredAt: -1 });
ActivityEventSchema.index({ userId: 1, occurredAt: -1 });
ActivityEventSchema.index({ clerkUserId: 1, occurredAt: -1 });
ActivityEventSchema.index({ email: 1, occurredAt: -1 });
ActivityEventSchema.index({ page: 1, occurredAt: -1 });
ActivityEventSchema.index({ path: 1, occurredAt: -1 });
ActivityEventSchema.index({ 'device.browser': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'device.deviceType': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'location.country': 1, occurredAt: -1 });

// Multikey for quick aggregations by session and type in time windows
ActivityEventSchema.index({ sessionId: 1, type: 1, occurredAt: -1 });

export const ActivityEvent: Model<IActivityEvent> =
  mongoose.models.ActivityEvent ||
  mongoose.model<IActivityEvent>('ActivityEvent', ActivityEventSchema);
