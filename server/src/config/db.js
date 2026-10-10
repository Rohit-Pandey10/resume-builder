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

export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

export const connectDB = async () => {
  // Return cached connection immediately if already established
  if (globalCache.mongooseCached.conn && mongoose.connection.readyState === 1) {
    return globalCache.mongooseCached.conn;
  }

  // If a connection is already in-flight, wait for it
  if (!globalCache.mongooseCached.promise) {
    globalCache.mongooseCached.promise = (async () => {
      try {
        let uri = process.env.MONGODB_URI;

        if (!uri) {
          if (process.env.NODE_ENV === 'production') {
            console.warn('Warning: MONGODB_URI is not configured. Account features are disabled.');
            return null;
          }

          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoMemoryServer = await MongoMemoryServer.create();
          uri = mongoMemoryServer.getUri();
        }

        const conn = await mongoose.connect(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        return conn;
      } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        globalCache.mongooseCached.promise = null;
        throw error;
      }
    })();
  }

  try {
    globalCache.mongooseCached.conn = await globalCache.mongooseCached.promise;
  } catch (err) {
    globalCache.mongooseCached.promise = null;
    globalCache.mongooseCached.conn = null;
    if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
      console.warn('Could not connect to database on startup. Proceeding with database features disabled.');
    }
    return null;
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
    console.error('Error disconnecting MongoDB:', error.message);
  }
};
