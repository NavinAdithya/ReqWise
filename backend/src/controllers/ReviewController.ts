import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReviewService } from '../services/ReviewService';
import { AiValidationService } from '../services/AiValidationService';
import { reviewReportSchema, clientDecisionSchema } from '../utils/validation';

export class ReviewController {
  static async reviewReport(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = reviewReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const report = await ReviewService.reviewReport(
        req.user.id,
        parsed.data.reportId,
        parsed.data.action,
        parsed.data.feedback
      );
      return res.status(200).json({ report });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async clientDecision(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = clientDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await ReviewService.clientDecision(req.user.id, parsed.data.requirementId, parsed.data);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async runComparativeAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const { reportId } = req.params;
      if (!reportId || !/^[0-9a-fA-F]{24}$/.test(reportId)) {
        return res.status(400).json({ message: 'Invalid report ID' });
      }

      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await AiValidationService.runComparativeAnalysis(reportId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default ReviewController;
