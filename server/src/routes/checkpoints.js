import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
  createCheckpointHandler, getCheckpointsHandler, updateCheckpointHandler,
  deleteCheckpointHandler, reportArrivalHandler, getArrivalsHandler,
} from '../controllers/checkpointController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { tripIdParamSchema } from '../validators/trip.js';
import { createCheckpointSchema, updateCheckpointSchema, arrivalSchema } from '../validators/checkpoint.js';

const router = Router();

router.get('/:tripId/checkpoints', authenticate, validateParams(tripIdParamSchema), catchAsync(getCheckpointsHandler));
router.post('/:tripId/checkpoints', authenticate, validateParams(tripIdParamSchema), validateBody(createCheckpointSchema), catchAsync(createCheckpointHandler));
router.patch('/:tripId/checkpoints/:checkpointId', authenticate, validateParams(tripIdParamSchema), validateBody(updateCheckpointSchema), catchAsync(updateCheckpointHandler));
router.delete('/:tripId/checkpoints/:checkpointId', authenticate, validateParams(tripIdParamSchema), catchAsync(deleteCheckpointHandler));
router.post('/:tripId/checkpoints/:checkpointId/arrivals', authenticate, validateParams(tripIdParamSchema), validateBody(arrivalSchema), catchAsync(reportArrivalHandler));
router.get('/:tripId/checkpoints/:checkpointId/arrivals', authenticate, validateParams(tripIdParamSchema), catchAsync(getArrivalsHandler));

export default router;
