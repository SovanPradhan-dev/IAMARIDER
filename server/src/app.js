import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isAllowedClientOrigin } from './config/clientOrigins.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
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
  app.use(cors({
    origin: (origin, callback) => callback(null, isAllowedClientOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Request logger
  app.use((req, _res, next) => {
    logger.debug('request', { method: req.method, path: req.path, userId: req.user ? req.user.userId : null });
    next();
  });

  // Health check
  app.get(['/health', '/api/v1/health'], (_req, res) => {
    res.json({ status: 'ok', service: 'ridetogether-server', time: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/trips', tripRoutes);
  app.use('/api/v1/trips', messageRoutes);
  app.use('/api/v1/trips', checkpointRoutes);
  app.use('/api/v1/trips', emergencyRoutes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
