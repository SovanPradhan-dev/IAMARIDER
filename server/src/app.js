import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalRateLimit } from './middleware/rateLimit.js';

import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import messageRoutes from './routes/messages.js';
import checkpointRoutes from './routes/checkpoints.js';
import emergencyRoutes from './routes/emergencies.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  }));

  // CORS with explicit allowed origins
  const allowedOrigins = [env.CLIENT_URL].filter(Boolean);
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Request logger
  app.use((req, res, next) => {
    logger.debug('request', { method: req.method, path: req.path, userId: req.user ? req.user.userId : null });
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ridetogether-server', time: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', (req, res, next) => {
    // mount profile routes under /users/me via authRoutes? kept separate for clarity
    next();
  });
  app.use('/api/v1', authRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/trips', messageRoutes);
  app.use('/api/v1/trips', checkpointRoutes);
  app.use('/api/v1/trips', emergencyRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
