import { Router, Response } from 'express';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';

const router = Router();

router.get('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const notifications = await NotificationService.getNotificationsForUser(req.user.id);
    return res.status(200).json({ notifications });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/read', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id);
    return res.status(200).json({ notification });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

export default router;
