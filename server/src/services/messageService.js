import { Message } from '../models/Message.js';
import { TripMember } from '../models/TripMember.js';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../config/logger.js';

export const createMessage = async ({ tripId, senderId, text }) => {
  const membership = await TripMember.findOne({ tripId, userId: senderId, status: 'joined' });
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  const message = await Message.create({ tripId, senderId, text });
  logger.info('message sent', { tripId, senderId });
  return message;
};

export const getMessages = async ({ tripId, userId, page = 1, limit = 50 }) => {
  const membership = await TripMember.findOne({ tripId, userId, status: 'joined' }).lean();
  if (!membership) {
    throw new AppError('You are not a member of this trip', 403);
  }

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    Message.find({ tripId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name avatarUrl')
      .lean(),
    Message.countDocuments({ tripId }),
  ]);

  return {
    messages: messages.reverse(), // chronological order
    total,
    page,
    limit,
    hasMore: skip + messages.length < total,
  };
};
