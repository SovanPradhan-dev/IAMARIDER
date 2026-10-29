import { AppError } from '../middleware/errorHandler.js';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js';

export const listNotificationsHandler = async (req, res) => {
  const { page = 1, limit = 20 } = req.validatedQuery || {};
  const result = await listNotifications(req.user.userId, { page, limit });
  res.json(result);
};

export const markNotificationReadHandler = async (req, res) => {
  const notification = await markNotificationRead(
    req.validatedParams.notificationId,
    req.user.userId
  );
  if (!notification) throw new AppError('Notification not found', 404);
  res.json({ notification });
};

export const markAllNotificationsReadHandler = async (req, res) => {
  const modifiedCount = await markAllNotificationsRead(req.user.userId);
  res.json({ modifiedCount });
};
