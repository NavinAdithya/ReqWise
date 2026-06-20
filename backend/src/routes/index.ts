import { Router } from 'express';
import authRoutes from './auth';
import requirementRoutes from './requirements';
import reportRoutes from './reports';
import reviewRoutes from './reviews';
import mistakeRoutes from './mistakes';
import assessmentRoutes from './assessments';
import analyticsRoutes from './analytics';
import notificationRoutes from './notifications';
import userRoutes from './users';

const router = Router();

router.use('/auth', authRoutes);
router.use('/requirements', requirementRoutes);
router.use('/reports', reportRoutes);
router.use('/reviews', reviewRoutes);
router.use('/mistakes', mistakeRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

export default router;
