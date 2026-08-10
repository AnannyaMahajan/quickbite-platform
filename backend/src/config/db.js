import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from '../services/seedData.js';

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && (mongoUri.includes('cluster0.mongodb.net') || mongoUri.includes('YOUR_MONGODB_URI'))) {
    console.warn('⚠️ MONGODB_URI contains unconfigured placeholder host. Using MongoMemoryServer engine.');
    mongoUri = null;
  }

  if (!mongoUri) {
    if (!global.__MONGO_MEMORY_SERVER__) {
      console.log('⚡ Launching MongoMemoryServer engine...');
      const mongod = await MongoMemoryServer.create({ instance: { dbName: 'quickbite_db' } });
      global.__MONGO_MEMORY_SERVER__ = mongod;
      mongoUri = mongod.getUri();
    } else {
      mongoUri = global.__MONGO_MEMORY_SERVER__.getUri();
    }
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    }).then((m) => {
      console.log(`🚀 MongoDB Connected to host: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.warn('⚠️ Primary MongoDB connection failed:', e.message);
    cached.promise = null;

    try {
      if (!global.__MONGO_MEMORY_SERVER__) {
        console.log('⚡ Falling back to in-memory MongoMemoryServer database...');
        const mongod = await MongoMemoryServer.create({ instance: { dbName: 'quickbite_db' } });
        global.__MONGO_MEMORY_SERVER__ = mongod;
      }
      const fallbackUri = global.__MONGO_MEMORY_SERVER__.getUri();
      cached.promise = mongoose.connect(fallbackUri, { bufferCommands: false, autoIndex: true });
      cached.conn = await cached.promise;
    } catch (fallbackErr) {
      cached.promise = null;
      throw fallbackErr;
    }
  }

  // Idempotent Seed Guard: Runs once if the database contains 0 users
  if (!global.isSeeded && !global.seedPromise) {
    global.seedPromise = (async () => {
      try {
        await seedDatabase();
        global.isSeeded = true;
      } catch (err) {
        console.warn('Idempotent database seeding warning:', err.message);
      } finally {
        global.seedPromise = null;
      }
    })();
  }

  if (global.seedPromise) {
    await global.seedPromise;
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
