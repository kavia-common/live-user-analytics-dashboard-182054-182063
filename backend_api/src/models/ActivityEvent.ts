import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ActivityType = 'login' | 'logout' | 'page_view' | 'click' | 'navigation';

export interface IActivityEvent extends Document {
  userId?: Types.ObjectId | null;
  sessionId?: Types.ObjectId | null;
  type: ActivityType;
  page?: string;
  device?: {
    os?: string;
    browser?: string;
    deviceType?: string; // desktop, mobile, tablet
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };
  metadata?: Record<string, any>;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityEventSchema = new Schema<IActivityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', index: true },
    type: { type: String, required: true, enum: ['login', 'logout', 'page_view', 'click', 'navigation'], index: true },
    page: { type: String, index: true },
    device: {
      os: { type: String },
      browser: { type: String, index: true },
      deviceType: { type: String, index: true },
    },
    location: {
      country: { type: String, index: true },
      region: { type: String },
      city: { type: String },
      lat: { type: Number },
      lon: { type: Number },
    },
    metadata: { type: Schema.Types.Mixed },
    occurredAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// Time-series oriented indexes
ActivityEventSchema.index({ occurredAt: -1 });
ActivityEventSchema.index({ type: 1, occurredAt: -1 });
ActivityEventSchema.index({ userId: 1, occurredAt: -1 });
ActivityEventSchema.index({ page: 1, occurredAt: -1 });
ActivityEventSchema.index({ 'device.browser': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'device.deviceType': 1, occurredAt: -1 });
ActivityEventSchema.index({ 'location.country': 1, occurredAt: -1 });

// Multikey for quick aggregations by session and type in time windows
ActivityEventSchema.index({ sessionId: 1, type: 1, occurredAt: -1 });

export const ActivityEvent: Model<IActivityEvent> =
  mongoose.models.ActivityEvent ||
  mongoose.model<IActivityEvent>('ActivityEvent', ActivityEventSchema);
