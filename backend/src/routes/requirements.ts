import { Router } from 'express';
import { RequirementController } from '../controllers/RequirementController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.post('/', protect, restrictTo('CLIENT', 'ADMIN'), RequirementController.create);
router.get('/', protect, RequirementController.list);
router.get('/:id', protect, RequirementController.getById);
router.patch('/:id/assign', protect, restrictTo('ADMIN'), RequirementController.assign);
router.get('/:id/checklist', protect, RequirementController.getChecklist);
router.put('/:id/checklist', protect, restrictTo('QA', 'ADMIN'), RequirementController.updateChecklist);
router.get('/:id/quality-gate', protect, restrictTo('ADMIN', 'QA'), RequirementController.evaluateQuality);

export default router;
