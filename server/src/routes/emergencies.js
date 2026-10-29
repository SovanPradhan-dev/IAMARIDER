import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
  createEmergencyHandler, getEmergenciesHandler, resolveEmergencyHandler,
} from '../controllers/emergencyController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { tripIdParamSchema } from '../validators/trip.js';
import {
  createEmergencySchema, resolveEmergencySchema, emergencyParamsSchema,
} from '../validators/emergency.js';

const router = Router();

router.post('/:tripId/emergencies', authenticate, validateParams(tripIdParamSchema), validateBody(createEmergencySchema), catchAsync(createEmergencyHandler));
router.get('/:tripId/emergencies', authenticate, validateParams(tripIdParamSchema), catchAsync(getEmergenciesHandler));
router.patch('/:tripId/emergencies/:eventId', authenticate, validateParams(emergencyParamsSchema), validateBody(resolveEmergencySchema), catchAsync(resolveEmergencyHandler));

export default router;
