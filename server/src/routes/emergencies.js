import { Router } from 'express';
import {
  createEmergencyHandler, getEmergenciesHandler, resolveEmergencyHandler,
} from '../controllers/emergencyController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { tripIdParamSchema } from '../validators/trip.js';
import { createEmergencySchema, resolveEmergencySchema } from '../validators/emergency.js';

const router = Router();

router.post('/:tripId/emergencies', authenticate, validateParams(tripIdParamSchema), validateBody(createEmergencySchema), createEmergencyHandler);
router.get('/:tripId/emergencies', authenticate, validateParams(tripIdParamSchema), getEmergenciesHandler);
router.patch('/:tripId/emergencies/:eventId', authenticate, validateParams(tripIdParamSchema), validateBody(resolveEmergencySchema), resolveEmergencyHandler);

export default router;
