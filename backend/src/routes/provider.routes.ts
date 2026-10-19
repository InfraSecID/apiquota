import { Router } from 'express';
import {
  ProviderController,
  createProviderSchema,
  updateProviderSchema,
  providerIdParamSchema,
} from '../controllers/provider.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { sensitiveWriteLimiter, syncTriggerLimiter } from '../middleware/rateLimiter.middleware';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect ALL /api/providers routes with JWT authentication
router.use(authenticate);

// Read-only operations for authenticated users (ADMIN or VIEWER)
router.get('/', ProviderController.getProviders);
router.get('/:id', validateRequest(providerIdParamSchema), ProviderController.getProviderById);

// Create provider: restricted strictly to ADMIN role
router.post(
  '/',
  requireAdmin,
  sensitiveWriteLimiter,
  validateRequest(createProviderSchema),
  ProviderController.createProvider
);

// Update provider
router.put(
  '/:id',
  sensitiveWriteLimiter,
  validateRequest(updateProviderSchema),
  ProviderController.updateProvider
);

// Delete provider: restricted strictly to ADMIN role
router.delete(
  '/:id',
  requireAdmin,
  validateRequest(providerIdParamSchema),
  ProviderController.deleteProvider
);

// Trigger manual sync
router.post(
  '/:id/sync',
  syncTriggerLimiter,
  validateRequest(providerIdParamSchema),
  ProviderController.syncProviderNow
);

export default router;
