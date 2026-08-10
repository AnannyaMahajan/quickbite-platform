import { Server } from 'socket.io';
import { verifyToken } from './jwt.js';
import { createAdapter } from '@socket.io/mongo-adapter';
import mongoose from 'mongoose';

let io = null;

export const initSocket = (server) => {
  const allowedOrigin = process.env.FRONTEND_URL || '*';

  io = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Attach MongoDB Adapter if database connection is active for multi-instance production broadcasting
  const setupMongoAdapter = async () => {
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const db = mongoose.connection.db;
        const COLLECTION_NAME = 'socket_events_pubsub';

        // Ensure capped collection for event streaming
        const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
        if (collections.length === 0) {
          await db.createCollection(COLLECTION_NAME, { capped: true, size: 5 * 1024 * 1024 });
        }

        const mongoCollection = db.collection(COLLECTION_NAME);
        io.adapter(createAdapter(mongoCollection));
        console.log('🔌 Socket.IO Mongo Adapter initialized for multi-instance broadcasting.');
      }
    } catch (err) {
      console.warn('⚠️ Could not initialize Mongo Adapter, falling back to default in-memory adapter:', err.message);
    }
  };

  // Attempt adapter setup
  if (mongoose.connection.readyState === 1) {
    setupMongoAdapter();
  } else {
    mongoose.connection.once('open', setupMongoAdapter);
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = verifyToken(token);
        socket.user = decoded;
      } catch (err) {
        console.log('Socket auth warning: Token verification failed');
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.id || 'Guest'})`);

    if (socket.user) {
      // Join personal user room
      socket.join(`user:${socket.user.id}`);

      // Join role room
      if (socket.user.role) {
        socket.join(`role:${socket.user.role.toLowerCase()}`);
      }

      // Join restaurant room if owner
      if (socket.user.restaurantId) {
        socket.join(`restaurant:${socket.user.restaurantId}`);
      }
    }

    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
