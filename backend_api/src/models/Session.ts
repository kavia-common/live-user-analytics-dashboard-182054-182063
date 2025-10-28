import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISession extends Document {
  userId?: Types.ObjectId | null;
  ip?: string;
  userAgent?: string;
  device?: {
    os?: string;
    browser?: string;
    deviceType?: string;
  };
  location?: {
    country?: string;
    region?: string;
    city?: string;
    lat?: number;
    lon?: number;
  };
  startedAt: Date;
  endedAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ip: { type: String, index: true },
    userAgent: { type: String },
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
    startedAt: { type: Date, required: true, index: true },
    endedAt: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Common analytics indexes
SessionSchema.index({ isActive: 1, startedAt: -1 });
SessionSchema.index({ userId: 1, startedAt: -1 });
SessionSchema.index({ 'device.browser': 1, startedAt: -1 });
SessionSchema.index({ 'device.deviceType': 1, startedAt: -1 });
SessionSchema.index({ 'location.country': 1, startedAt: -1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
