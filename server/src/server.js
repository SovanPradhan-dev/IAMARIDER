import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './socket/index.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { isAllowedClientOrigin } from './config/clientOrigins.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => callback(null, isAllowedClientOrigin(origin)),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

initSocket(io);
app.set('io', io);

let server = null;

const start = async () => {
  try {
    await connectDB();
    server = httpServer.listen(env.PORT, env.HOST, () => {
      logger.info('server listening', { host: env.HOST, port: env.PORT, env: env.NODE_ENV });
    });
  } catch (err) {
    logger.error('failed to start server', { error: err.message });
    process.exit(1);
  }
};

const gracefulShutdown = async (signal) => {
  logger.info(`received ${signal}, shutting down`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();

export { app, io };
