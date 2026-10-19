import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { sensitiveWriteLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/register',
  sensitiveWriteLimiter,
  validateRequest(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  sensitiveWriteLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', AuthController.logout);

export default router;
