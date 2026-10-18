import { Router } from 'express';
import {
  AlertController,
  updateAlertConfigSchema,
  testAlertSchema,
} from '../controllers/alert.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { sensitiveWriteLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/config', AlertController.getConfig);
router.put(
  '/config',
  sensitiveWriteLimiter,
  validateRequest(updateAlertConfigSchema),
  AlertController.updateConfig
);
router.post(
  '/test',
  sensitiveWriteLimiter,
  validateRequest(testAlertSchema),
  AlertController.testAlert
);
router.get('/logs', AlertController.getLogs);

export default router;
