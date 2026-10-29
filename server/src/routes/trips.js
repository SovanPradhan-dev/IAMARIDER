import { Router } from 'express';
import { z } from 'zod';
import { catchAsync } from '../utils/catchAsync.js';
import {
  createTripHandler, listTripsHandler, getTripHandler, joinTripHandler,
  leaveTripHandler, updateTripHandler, removeMemberHandler, startTripHandler,
  endTripHandler, cancelTripHandler, transferLeadershipHandler, listMembersHandler,
  getLocationsHandler, getLocationHistoryHandler, getHistorySummaryHandler,
} from '../controllers/tripController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.js';
import {
  createTripSchema, joinTripSchema, updateTripSchema, tripIdParamSchema,
  memberUserIdParamSchema,
} from '../validators/trip.js';
import { historyQuerySchema as trackingQuerySchema } from '../validators/tracking.js';
import { locationUpdateSchema } from '../validators/tracking.js';
import { updateLocationHandler, stopSharingHandler } from '../controllers/locationController.js';

const router = Router();

// Trip CRUD
router.post('/', authenticate, validateBody(createTripSchema), catchAsync(createTripHandler));
router.get('/', authenticate, catchAsync(listTripsHandler));
router.get('/:tripId', authenticate, validateParams(tripIdParamSchema), catchAsync(getTripHandler));
router.patch('/:tripId', authenticate, validateParams(tripIdParamSchema), validateBody(updateTripSchema), catchAsync(updateTripHandler));

// Join / leave
router.post('/join', authenticate, validateBody(joinTripSchema), catchAsync(joinTripHandler));
router.post('/:tripId/leave', authenticate, validateParams(tripIdParamSchema), catchAsync(leaveTripHandler));

// Members
router.get('/:tripId/members', authenticate, validateParams(tripIdParamSchema), catchAsync(listMembersHandler));
router.delete('/:tripId/members/:userId', authenticate, validateParams(memberUserIdParamSchema), catchAsync(removeMemberHandler));

// Lifecycle
router.post('/:tripId/start', authenticate, validateParams(tripIdParamSchema), catchAsync(startTripHandler));
router.post('/:tripId/end', authenticate, validateParams(tripIdParamSchema), catchAsync(endTripHandler));
router.post('/:tripId/cancel', authenticate, validateParams(tripIdParamSchema), catchAsync(cancelTripHandler));
router.post(
  '/:tripId/transfer-leadership',
  authenticate,
  validateParams(tripIdParamSchema),
  validateBody(z.object({ targetUserId: z.string().min(1, 'Target user ID is required') })),
  catchAsync(transferLeadershipHandler)
);

// Tracking
router.get('/:tripId/locations', authenticate, validateParams(tripIdParamSchema), catchAsync(getLocationsHandler));
router.post('/:tripId/locations', authenticate, validateParams(tripIdParamSchema), validateBody(locationUpdateSchema), catchAsync(updateLocationHandler));
router.delete('/:tripId/locations', authenticate, validateParams(tripIdParamSchema), catchAsync(stopSharingHandler));
router.get('/:tripId/history', authenticate, validateParams(tripIdParamSchema), validateQuery(trackingQuerySchema), catchAsync(getLocationHistoryHandler));
router.get('/:tripId/history/summary', authenticate, validateParams(tripIdParamSchema), validateQuery(trackingQuerySchema), catchAsync(getHistorySummaryHandler));

export default router;
