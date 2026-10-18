import { Router } from 'express';
import providerRoutes from './provider.routes';
import dashboardRoutes from './dashboard.routes';
import alertRoutes from './alert.routes';

const router = Router();

router.use('/providers', providerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);

export default router;
