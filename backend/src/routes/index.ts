import { Router } from 'express';
import authRoutes from './auth.routes';
import providerRoutes from './provider.routes';
import dashboardRoutes from './dashboard.routes';
import alertRoutes from './alert.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);

export default router;
