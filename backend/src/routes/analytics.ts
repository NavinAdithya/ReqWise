import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, AnalyticsController.getDashboardData);

export default router;
