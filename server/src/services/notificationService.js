import { Notification } from '../models/Notification.js';
import { TripMember } from '../models/TripMember.js';

const preferenceForType = (type) => {
  if (type === 'emergency_alert') return 'safetyAlerts';
  if (type === 'checkpoint_arrival') return 'checkpointArrivals';
  return 'tripUpdates';
};

const emitNotification = (io, notification) => {
  io?.to(`user:${notification.userId}`).emit('notification:new', notification);
};

export const notifyTripMembers = async (
  io,
  tripId,
  { type, title, message, excludeUserIds = [] }
) => {
  const preference = preferenceForType(type);
  const members = await TripMember.find({
    tripId,
    status: 'joined',
    userId: { $nin: excludeUserIds },
  }).populate('userId', 'notificationPreferences').lean();

  const recipients = members
    .filter((member) => member.userId?.notificationPreferences?.[preference] !== false)
    .map((member) => member.userId._id);

  if (!recipients.length) return;

  const notifications = await Notification.insertMany(recipients.map((userId) => ({
    userId,
    tripId,
    type,
    title,
    message,
  })));

  notifications.forEach((notification) => emitNotification(io, notification.toObject()));
};

export const notifyUser = async (io, userId, tripId, { type, title, message }) => {
  const notification = await Notification.create({ userId, tripId, type, title, message });
  emitNotification(io, notification.toObject());
};

export const listNotifications = async (userId, { page = 1, limit = 20 }) => {
  const filter = { userId };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);

  return { notifications, total, unreadCount, page, limit };
};

export const markNotificationRead = async (notificationId, userId) => (
  Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { readAt: new Date() } },
    { new: true }
  )
);

export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, readAt: null },
    { $set: { readAt: new Date() } }
  );
  return result.modifiedCount;
};
