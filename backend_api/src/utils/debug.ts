import mongoose from 'mongoose';
import { getEnv } from '../config/env.js';

/**
 * PUBLIC_INTERFACE
 * debugLog prints structured debug logs only when NODE_ENV !== 'production'.
 * It avoids leaking sensitive data by design — do not pass secrets (JWT secret, raw passwords).
 */
export function debugLog(scope: string, message: string, data?: Record<string, any>) {
  const { NODE_ENV } = getEnv();
  if (NODE_ENV === 'production') return;
  // eslint-disable-next-line no-console
  console.log(`[DEBUG] [${scope}] ${message}`, data ? safeSerialize(data) : '');
}

/**
 * PUBLIC_INTERFACE
 * debugError logs an error with context in non-production.
 */
export function debugError(scope: string, message: string, err?: unknown, data?: Record<string, any>) {
  const { NODE_ENV } = getEnv();
  if (NODE_ENV === 'production') return;
  // eslint-disable-next-line no-console
  console.error(`[DEBUG] [${scope}] ${message}`, {
    ...(data ? safeSerialize(data) : {}),
    error: serializeError(err),
  });
}

function safeSerialize(obj: Record<string, any>) {
  try {
    return JSON.parse(JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'string') {
        // mask long tokens/hashes
        if (value.length > 24) {
          return `${value.slice(0, 6)}...(${value.length})`;
        }
      }
      return value;
    }));
  } catch {
    return obj;
  }
}

function serializeError(err: any) {
  if (!err) return null;
  return {
    name: err.name || 'Error',
    message: err.message || String(err),
    stack: err.stack ? String(err.stack).split('\n').slice(0, 3).join('\n') : undefined,
  };
}

/**
 * PUBLIC_INTERFACE
 * logMongoStatus logs current mongoose connection state for diagnostics.
 */
export function logMongoStatus(context: string) {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  };
  const state = (mongoose as any).connection?.readyState;
  debugLog('mongo', `Mongoose state during ${context}`, { state, stateLabel: states[state as number] || 'unknown' });
}
