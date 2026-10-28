import { createMessage, getMessages } from '../services/messageService.js';

export const sendMessageHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { text } = req.validatedBody;
  const message = await createMessage({ tripId, senderId: req.user.userId, text });
  res.status(201).json({ message });
};

export const getMessagesHandler = async (req, res) => {
  const { tripId } = req.validatedParams;
  const { page = 1, limit = 50 } = req.validatedQuery || {};
  const result = await getMessages({ tripId, userId: req.user.userId, page, limit });
  res.json(result);
};
