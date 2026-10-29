import { Router } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import {
  createCheckpointHandler, getCheckpointsHandler, updateCheckpointHandler,
  deleteCheckpointHandler, reportArrivalHandler, getArrivalsHandler,
} from '../controllers/checkpointController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validation.js';
import { tripIdParamSchema } from '../validators/trip.js';
import {
  createCheckpointSchema, updateCheckpointSchema, arrivalSchema, checkpointParamsSchema,
} from '../validators/checkpoint.js';

const router = Router();

router.get('/:tripId/checkpoints', authenticate, validateParams(tripIdParamSchema), catchAsync(getCheckpointsHandler));
router.post('/:tripId/checkpoints', authenticate, validateParams(tripIdParamSchema), validateBody(createCheckpointSchema), catchAsync(createCheckpointHandler));
router.patch('/:tripId/checkpoints/:checkpointId', authenticate, validateParams(checkpointParamsSchema), validateBody(updateCheckpointSchema), catchAsync(updateCheckpointHandler));
router.delete('/:tripId/checkpoints/:checkpointId', authenticate, validateParams(checkpointParamsSchema), catchAsync(deleteCheckpointHandler));
router.post('/:tripId/checkpoints/:checkpointId/arrivals', authenticate, validateParams(checkpointParamsSchema), validateBody(arrivalSchema), catchAsync(reportArrivalHandler));
router.get('/:tripId/checkpoints/:checkpointId/arrivals', authenticate, validateParams(checkpointParamsSchema), catchAsync(getArrivalsHandler));

export default router;
