import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * User roles for authorization, e.g., admin, user.
 */
export type UserRole = 'admin' | 'user';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  role: UserRole;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(plain: string): Promise<boolean>;
}

// Define schema
const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    lastLoginAt: { type: Date, index: true },
  },
  { timestamps: true }
);

// Compound index for analytics lookups (e.g., role distribution over time)
UserSchema.index({ role: 1, createdAt: -1 });

// Method to compare password
UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

// Static helper for creating a user with password hashing
// PUBLIC_INTERFACE
export async function createUserWithPassword(
  UserModel: Model<IUser>,
  params: { email: string; password: string; name?: string; role?: UserRole }
): Promise<IUser> {
  /** Creates a user by hashing the provided password before save. */
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(params.password, saltRounds);
  const user = new UserModel({
    email: params.email,
    passwordHash,
    name: params.name,
    role: params.role || 'user',
  });
  return user.save();
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
