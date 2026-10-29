import { Router } from 'express';
import { z } from 'zod';
import { catchAsync } from '../utils/catchAsync.js';
import {
  registerHandler, loginHandler, refreshHandler, logoutHandler,
  meHandler, updateProfileHandler, myTripsHandler, changePasswordHandler,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.js';

const router = Router();

router.post('/register', validateBody(registerSchema), catchAsync(registerHandler));
router.post('/login', validateBody(loginSchema), catchAsync(loginHandler));
router.post('/refresh', catchAsync(refreshHandler));
router.post('/logout', authenticate, catchAsync(logoutHandler));
router.patch(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  catchAsync(changePasswordHandler)
);
router.get('/me', authenticate, catchAsync(meHandler));
router.patch('/me', authenticate, validateBody(updateProfileSchema), catchAsync(updateProfileHandler));
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
