import { Router } from 'express';
import { z } from 'zod';
import {
  createTripHandler, listTripsHandler, getTripHandler, joinTripHandler,
  leaveTripHandler, updateTripHandler, removeMemberHandler, startTripHandler,
  endTripHandler, cancelTripHandler, transferLeadershipHandler, listMembersHandler,
  getLocationsHandler, getHistorySummaryHandler,
} from '../controllers/tripController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import { messageRateLimit, locationRateLimit } from '../middleware/rateLimit.js';
import {
  createTripSchema, joinTripSchema, updateTripSchema, tripIdParamSchema,
  memberUserIdParamSchema,
} from '../validators/trip.js';
import { historyQuerySchema as trackingQuerySchema } from '../validators/tracking.js';

const router = Router();

// Trip CRUD
router.post('/', authenticate, validateBody(createTripSchema), createTripHandler);
router.get('/', authenticate, listTripsHandler);
router.get('/:tripId', authenticate, validateParams(tripIdParamSchema), getTripHandler);
router.patch('/:tripId', authenticate, validateParams(tripIdParamSchema), validateBody(updateTripSchema), updateTripHandler);

// Join / leave
router.post('/join', authenticate, validateBody(joinTripSchema), joinTripHandler);
router.post('/:tripId/leave', authenticate, validateParams(tripIdParamSchema), leaveTripHandler);

// Members
router.get('/:tripId/members', authenticate, validateParams(tripIdParamSchema), listMembersHandler);
router.delete('/:tripId/members/:userId', authenticate, validateParams(memberUserIdParamSchema), removeMemberHandler);

// Lifecycle
router.post('/:tripId/start', authenticate, validateParams(tripIdParamSchema), startTripHandler);
router.post('/:tripId/end', authenticate, validateParams(tripIdParamSchema), endTripHandler);
router.post('/:tripId/cancel', authenticate, validateParams(tripIdParamSchema), cancelTripHandler);
router.post(
  '/:tripId/transfer-leadership',
  authenticate,
  validateParams(tripIdParamSchema),
  validateBody(z.object({ targetUserId: z.string().min(1, 'Target user ID is required') })),
  transferLeadershipHandler
);

// Tracking
router.get('/:tripId/locations', authenticate, validateParams(tripIdParamSchema), getLocationsHandler);
router.get('/:tripId/history/summary', authenticate, validateParams(tripIdParamSchema), validateQuery(trackingQuerySchema), getHistorySummaryHandler);

export default router;
