import mongoose from 'mongoose';
import { seedDatabase } from '../services/seedData.js';

// Configure MongoMemoryServer writable temp directory for Vercel/Serverless environments
if (!process.env.MONGOMS_DOWNLOAD_DIR) {
  process.env.MONGOMS_DOWNLOAD_DIR = '/tmp';
}

let MongoMemoryServer;

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && (mongoUri.includes('cluster0.mongodb.net') || mongoUri.includes('YOUR_MONGODB_URI'))) {
    console.warn('⚠️ MONGODB_URI contains unconfigured placeholder host. Falling back to in-memory database.');
    mongoUri = null;
  }

  if (!mongoUri) {
    if (!MongoMemoryServer) {
      const module = await import('mongodb-memory-server');
      MongoMemoryServer = module.MongoMemoryServer;
    }

    if (!global.__MONGO_MEMORY_SERVER__) {
      console.log('⚡ Launching MongoMemoryServer engine in /tmp...');
      const mongod = await MongoMemoryServer.create({
        instance: { dbName: 'quickbite_db' },
        binary: { downloadDir: '/tmp' }
      });
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
    console.warn('⚠️ MongoDB connection error:', e.message);
    cached.promise = null;

    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      throw new Error(`MongoDB Atlas Connection Failed: ${e.message}. Please verify MONGODB_URI configuration in Vercel project settings.`);
    }
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
