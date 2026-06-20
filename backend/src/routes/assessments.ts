import { Router } from 'express';
import { AssessmentController } from '../controllers/AssessmentController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('QA'), AssessmentController.submitAnswers);
router.post('/trigger/:qaId', protect, restrictTo('ADMIN'), AssessmentController.triggerManual);
router.get('/', protect, restrictTo('ADMIN'), AssessmentController.listAll);
router.get('/qa/:qaId', protect, AssessmentController.getByQA);
router.get('/:id', protect, AssessmentController.getById);

export default router;
