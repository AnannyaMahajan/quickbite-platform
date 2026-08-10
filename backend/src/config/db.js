import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from '../services/seedData.js';

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    if (!mongoUri || mongoUri.includes('cluster0.mongodb.net') || mongoUri.includes('YOUR_MONGODB_URI')) {
      console.warn('⚠️ MONGODB_URI is missing or unconfigured in Vercel project settings.');
      throw new Error('MONGODB_URI is missing or unconfigured in Vercel Project Settings. Please configure a valid MongoDB Atlas connection string in Vercel Environment Variables.');
    }
  } else {
    if (!mongoUri) {
      if (!global.__MONGO_MEMORY_SERVER__) {
        console.log('⚡ Launching local MongoMemoryServer engine...');
        const mongod = await MongoMemoryServer.create({ instance: { dbName: 'quickbite_db' } });
        global.__MONGO_MEMORY_SERVER__ = mongod;
        mongoUri = mongod.getUri();
      } else {
        mongoUri = global.__MONGO_MEMORY_SERVER__.getUri();
      }
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
    console.warn('⚠️ MongoDB connection error:', e.message);
    cached.promise = null;
    throw e;
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
