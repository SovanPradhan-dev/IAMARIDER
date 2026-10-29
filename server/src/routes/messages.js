import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import { getMessagesHandler, sendMessageHandler } from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { messageRateLimit } from '../middleware/rateLimit.js';
import { tripIdParamSchema } from '../validators/trip.js';
import { sendMessageSchema, messagesQuerySchema } from '../validators/message.js';

const router = Router();

router.get('/:tripId/messages', authenticate, validateParams(tripIdParamSchema), validateQuery(messagesQuerySchema), catchAsync(getMessagesHandler));
router.post('/:tripId/messages', authenticate, validateParams(tripIdParamSchema), messageRateLimit, validateBody(sendMessageSchema), catchAsync(sendMessageHandler));

export default router;
