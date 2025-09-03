import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getDashboardMetrics } from '../controllers/metrics.controller';

const router = Router();

router.get('/', authMiddleware, getDashboardMetrics);

export default router;
