import { Router } from 'express';
import { z } from 'zod';
import { catchAsync } from '../utils/catchAsync.js';
import { meHandler, updateProfileHandler, myTripsHandler } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { updateProfileSchema } from '../validators/user.js';
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from '../controllers/notificationController.js';
import { validateParams } from '../middleware/validation.js';

const router = Router();

router.get('/me', authenticate, catchAsync(meHandler));
router.patch('/me', authenticate, validateBody(updateProfileSchema), catchAsync(updateProfileHandler));
router.get(
  '/me/notifications',
  authenticate,
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })),
  catchAsync(listNotificationsHandler)
);
router.patch(
  '/me/notifications/read-all',
  authenticate,
  catchAsync(markAllNotificationsReadHandler)
);
router.patch(
  '/me/notifications/:notificationId/read',
  authenticate,
  validateParams(z.object({ notificationId: z.string().regex(/^[a-f\d]{24}$/i) })),
  catchAsync(markNotificationReadHandler)
);
router.get(
  '/me/trips',
  authenticate,
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })),
  catchAsync(myTripsHandler)
);

export default router;
