import { Router } from 'express';
import {
  ProviderController,
  createProviderSchema,
  updateProviderSchema,
  providerIdParamSchema,
} from '../controllers/provider.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { sensitiveWriteLimiter, syncTriggerLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/', ProviderController.getProviders);
router.get('/:id', validateRequest(providerIdParamSchema), ProviderController.getProviderById);
router.post(
  '/',
  sensitiveWriteLimiter,
  validateRequest(createProviderSchema),
  ProviderController.createProvider
);
router.put(
  '/:id',
  sensitiveWriteLimiter,
  validateRequest(updateProviderSchema),
  ProviderController.updateProvider
);
router.delete('/:id', validateRequest(providerIdParamSchema), ProviderController.deleteProvider);
router.post(
  '/:id/sync',
  syncTriggerLimiter,
  validateRequest(providerIdParamSchema),
  ProviderController.syncProviderNow
);

export default router;
