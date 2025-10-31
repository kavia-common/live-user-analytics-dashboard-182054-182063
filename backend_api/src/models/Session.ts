import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId?: Types.ObjectId | null;

  // Snapshot of identity from Clerk
  clerkUserId?: string | null;
  email?: string | null;

  // Network and UA
  ip?: string | null;
  userAgent?: string | null;

  // Device normalization
  device?: {
    ua?: string | null;
    os?: string;
    browser?: string;
    deviceType?: string;
  };

  // Location
  location?: {
    ip?: string | null;
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };

  // Navigational context (first page)
  path?: string | null;
  referrer?: string | null;

  startedAt: Date;
  endedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    clerkUserId: { type: String, index: true },
    email: { type: String, index: true, lowercase: true },

    ip: { type: String, index: true },
    userAgent: { type: String },

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

    path: { type: String, index: true },
    referrer: { type: String },

    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Common analytics indexes
SessionSchema.index({ isActive: 1, startedAt: -1 });
SessionSchema.index({ userId: 1, startedAt: -1 });
SessionSchema.index({ clerkUserId: 1, startedAt: -1 });
SessionSchema.index({ email: 1, startedAt: -1 });
SessionSchema.index({ path: 1, startedAt: -1 });
SessionSchema.index({ 'device.browser': 1, startedAt: -1 });
SessionSchema.index({ 'device.deviceType': 1, startedAt: -1 });
SessionSchema.index({ 'location.country': 1, startedAt: -1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
