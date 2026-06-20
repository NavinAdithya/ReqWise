import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('ADMIN'), ReviewController.reviewReport);
router.get('/:reportId/comparative-analysis', protect, restrictTo('ADMIN'), ReviewController.runComparativeAnalysis);
router.post('/client/decision', protect, restrictTo('CLIENT'), ReviewController.clientDecision);

export default router;
