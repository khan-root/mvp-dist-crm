import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crm";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
if (process.env.NODE_ENV !== "production") global.mongoose = cached;

/**
 * Reuse connection across hot reloads in development; single connection in production.
 */
export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;

  // Drop stale name_1 unique index on users collection if it exists in MongoDB
  try {
    const usersColl = cached.conn.connection.collection("users");
    const indexes = await usersColl.indexes();
    if (indexes.some((idx) => idx.name === "name_1")) {
      await usersColl.dropIndex("name_1");
    }
  } catch {
    // Ignore error if index doesn't exist
  }

  return cached.conn;
}
