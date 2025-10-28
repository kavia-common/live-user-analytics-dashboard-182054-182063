import mongoose from 'mongoose';

/**
 * PUBLIC_INTERFACE
 * Establish a connection to MongoDB using Mongoose.
 * Uses MONGODB_URI from environment variables. The connection is cached
 * across hot reloads in dev (nodemon) by using a singleton pattern on global.
 */
export async function connectMongo(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  // Avoid creating multiple connections in development with hot reload.
  if ((global as any)._mongooseConnection) {
    return (global as any)._mongooseConnection;
  }

  // Connection options tuned for production-ish defaults.
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    // serverSelectionTimeoutMS: 5000,  // customizable
    // maxPoolSize: 10,                 // customizable
  });

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('MongoDB disconnected');
  });

  // Cache connection
  (global as any)._mongooseConnection = conn;
  return conn;
}
