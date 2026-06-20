import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.get('/qa-performance', protect, restrictTo('ADMIN'), UserController.getQAPerformance);

export default router;
