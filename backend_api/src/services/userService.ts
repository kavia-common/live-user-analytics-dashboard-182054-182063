import { User } from '../models/User.js';

/**
 * PUBLIC_INTERFACE
 * listUsers returns a paginated list of users
 */
export async function listUsers(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return {
    items: items.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name || '',
      role: u.role,
      lastLoginAt: u.lastLoginAt || null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    })),
    total,
    page,
    limit,
  };
}

/**
 * PUBLIC_INTERFACE
 * updateUserRole updates the role for a user (admin only)
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user') {
  const updated = await User.findByIdAndUpdate(userId, { role }, { new: true });
  if (!updated) {
    const err: any = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return {
    id: updated._id.toString(),
    email: updated.email,
    name: updated.name || '',
    role: updated.role,
    lastLoginAt: updated.lastLoginAt || null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}
