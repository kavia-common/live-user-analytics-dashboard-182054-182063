import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { User, IUser, createUserWithPassword } from '../models/User.js';

/**
 * PUBLIC_INTERFACE
 * generateToken issues a JWT for the given user.
 */
export function generateToken(user: IUser): string {
  const { JWT_SECRET } = getEnv();
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  // 12h expiry is a sensible default for dashboards
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

/**
 * PUBLIC_INTERFACE
 * signup registers a new user and returns token + user data
 */
export async function signup(params: { email: string; password: string; name?: string; role?: 'admin' | 'user' }) {
  const existing = await User.findOne({ email: params.email });
  if (existing) {
    const err: any = new Error('Email already in use');
    err.statusCode = 400;
    throw err;
  }
  const user = await createUserWithPassword(User, params);
  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

/**
 * PUBLIC_INTERFACE
 * login authenticates user credentials and returns token + user data
 */
export async function login(params: { email: string; password: string }) {
  const user = await User.findOne({ email: params.email });
  if (!user) {
    const err: any = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const ok = await user.comparePassword(params.password);
  if (!ok) {
    const err: any = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

/**
 * PUBLIC_INTERFACE
 * sanitizeUser strips sensitive fields
 */
export function sanitizeUser(user: IUser) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name || '',
    role: user.role,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
