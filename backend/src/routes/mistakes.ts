import { Router } from 'express';
import { MistakeController } from '../controllers/MistakeController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('ADMIN'), MistakeController.create);
router.get('/', protect, restrictTo('ADMIN'), MistakeController.listAll);
router.get('/qa/:qaId', protect, MistakeController.listByQA);

export default router;
