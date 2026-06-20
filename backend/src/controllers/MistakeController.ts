import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { MistakeService } from '../services/MistakeService';
import { Mistake } from '../models/Mistake';
import { logMistakeSchema } from '../utils/validation';

export class MistakeController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = logMistakeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await MistakeService.logMistake(req.user.id, parsed.data);
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async listByQA(req: AuthenticatedRequest, res: Response) {
    try {
      const qaId = req.params.qaId;
      const mistakes = await Mistake.find({ qa: qaId }).sort({ createdAt: -1 });
      return res.status(200).json({ mistakes });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
  static async listAll(req: AuthenticatedRequest, res: Response) {
    try {
      const mistakes = await Mistake.find().populate('qa').populate('requirement').sort({ createdAt: -1 });
      return res.status(200).json({ mistakes });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default MistakeController;
