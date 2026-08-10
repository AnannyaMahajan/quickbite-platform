import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.warn('⚠️ MONGODB_URI environment variable is missing in production deployment.');
      throw new Error('MONGODB_URI environment variable is not configured in Vercel project settings.');
    }

    if (!global.__MONGO_MEMORY_SERVER__) {
      console.log('⚡ MONGODB_URI not provided. Launching local MongoMemoryServer engine...');
      const mongod = await MongoMemoryServer.create({ instance: { dbName: 'quickbite_db' } });
      global.__MONGO_MEMORY_SERVER__ = mongod;
      mongoUri = mongod.getUri();
    } else {
      mongoUri = global.__MONGO_MEMORY_SERVER__.getUri();
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      autoIndex: true,
      maxPoolSize: 10
    }).then((m) => {
      console.log(`🚀 MongoDB Connected to host: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (global.__MONGO_MEMORY_SERVER__) {
      await global.__MONGO_MEMORY_SERVER__.stop();
      global.__MONGO_MEMORY_SERVER__ = null;
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
};
