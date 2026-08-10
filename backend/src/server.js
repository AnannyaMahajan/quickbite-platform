import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { seedDatabase } from './services/seedData.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Production-Safe CORS Configuration
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

// Connect DB & Seed Database
connectDB().then(async () => {
  await seedDatabase();
}).catch((err) => {
  console.error('Database connection / seed initialization error:', err);
});

// Health check endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    success: true,
    status: 'UP',
    platform: 'QuickBite Food Delivery Platform',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/complaints', complaintRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Local Development Guard: Only call server.listen when NOT running inside Vercel Function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 QuickBite Server Running on Port: ${PORT}`);
    console.log(`🔌 Real-Time Socket.IO Engine Initialized`);
    console.log(`==================================================\n`);
  });
}

export default app;
export { server };
