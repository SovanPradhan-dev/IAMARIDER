import { Router } from 'express';
import { z } from 'zod';
import {
  registerHandler, loginHandler, refreshHandler, logoutHandler,
  meHandler, updateProfileHandler, myTripsHandler,
} from '../controllers/authController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import { updateProfileSchema } from '../validators/user.js';

const router = Router();

router.post('/register', authRateLimit, validateBody(registerSchema), registerHandler);
router.post('/login', authRateLimit, validateBody(loginSchema), loginHandler);
router.post('/refresh', authRateLimit, refreshHandler);
router.post('/logout', authenticate, logoutHandler);
router.get('/me', authenticate, meHandler);
router.patch('/me', authenticate, validateBody(updateProfileSchema), updateProfileHandler);
router.get(
  '/me/trips',
  authenticate,
  validateQuery(z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })),
  myTripsHandler
);

export default router;
