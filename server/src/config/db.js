import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Global connection cache for serverless environments (Vercel, AWS Lambda, etc.)
// A single container may handle many requests; caching the Promise means
// mongoose.connect() is only called once per container lifetime, preventing
// connection pool exhaustion on cold/warm starts.
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-undef
const globalCache = global;
if (!globalCache.mongooseCached) {
  globalCache.mongooseCached = { conn: null, promise: null };
}

let mongoMemoryServer = null;

export const connectDB = async () => {
  // Return cached connection immediately if already established
  if (globalCache.mongooseCached.conn) {
    return globalCache.mongooseCached.conn;
  }

  // If a connection is already in-flight, wait for it
  if (!globalCache.mongooseCached.promise) {
    globalCache.mongooseCached.promise = (async () => {
      try {
        let uri = process.env.MONGODB_URI;

        if (!uri) {
          console.log('No MONGODB_URI provided. Starting in-memory MongoDB for local dev/test...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create();
          uri = mongoMemoryServer.getUri();
          console.log(`In-memory MongoDB started at: ${uri}`);
        }

        const conn = await mongoose.connect(uri, {
          // Recommended settings for serverless: keep connection pool small
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Reset promise so next invocation will retry
        globalCache.mongooseCached.promise = null;
        throw error;
      }
    })();
  }

  try {
    globalCache.mongooseCached.conn = await globalCache.mongooseCached.promise;
  } catch (err) {
    globalCache.mongooseCached.promise = null;
    // In serverless we throw; in long-running server we exit
    if (process.env.VERCEL !== '1') process.exit(1);
    throw err;
  }

  return globalCache.mongooseCached.conn;
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    globalCache.mongooseCached = { conn: null, promise: null };
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
  } catch (error) {
    console.error(`Error disconnecting MongoDB: ${error.message}`);
  }
};
