import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('QA'), ReportController.draft);
router.post('/:id/submit', protect, restrictTo('QA'), ReportController.submit);
router.get('/requirement/:id', protect, ReportController.getByRequirement);
router.post('/validation/run', protect, restrictTo('QA', 'ADMIN', 'CLIENT'), ReportController.runValidation);
router.post('/:id/ai-validate', protect, restrictTo('ADMIN'), ReportController.aiValidate);

export default router;
