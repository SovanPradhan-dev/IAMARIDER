import { logger } from '../config/logger.js';
import {
  notifyTripMembers as createTripNotifications,
  notifyUser as createUserNotification,
} from '../services/notificationService.js';

export const emitTripEvent = (req, tripId, event, payload) => {
  req.app.get('io')?.to(tripId.toString()).emit(event, payload);
};

export const notifyTripMembers = async (io, tripId, notification) => {
  try {
    await createTripNotifications(io, tripId, notification);
  } catch (error) {
    logger.error('failed to persist trip notifications', {
      tripId: tripId.toString(),
      type: notification.type,
      error: error.message,
    });
  }
};

export const notifyTripUser = async (io, userId, tripId, notification) => {
  try {
    await createUserNotification(io, userId, tripId, notification);
  } catch (error) {
    logger.error('failed to persist user notification', {
      tripId: tripId.toString(),
      userId: userId.toString(),
      type: notification.type,
      error: error.message,
    });
  }
};

export const removeUserFromTripRoom = async (io, tripId, userId) => {
  if (!io) return;
  const room = tripId.toString();
  const sockets = await io.in(room).fetchSockets();
  for (const socket of sockets) {
    if (socket.data.userId === userId.toString()) {
      await socket.leave(room);
    }
  }
  io.to(`user:${userId}`).emit('trip:member:removed', { tripId: room });
};
