import { createMessage, getMessages } from '../services/messageService.js';
import { Message } from '../models/Message.js';
import { emitTripEvent } from '../utils/tripEvents.js';

export const sendMessageHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { text } = req.validatedBody;
  const created = await createMessage({ tripId, senderId: req.user.userId, text });
  const message = await Message.findById(created._id).populate('senderId', 'name avatarUrl').lean();
  emitTripEvent(req, tripId, 'trip:message:new', message);
  res.status(201).json({ message });
};

export const getMessagesHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { page = 1, limit = 50 } = req.validatedQuery || {};
  const result = await getMessages({ tripId, userId: req.user.userId, page, limit });
  res.json(result);
};
