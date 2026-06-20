import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AssessmentService } from '../services/AssessmentService';
import { Assessment } from '../models/Assessment';
import { submitAssessmentSchema } from '../utils/validation';

export class AssessmentController {
  static async submitAnswers(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = submitAssessmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const assessment = await AssessmentService.submitAssessmentAnswers(
        req.user.id,
        parsed.data.assessmentId,
        parsed.data.answers
      );

      return res.status(200).json({ assessment });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async getByQA(req: AuthenticatedRequest, res: Response) {
    try {
      const qaId = req.params.qaId;
      const assessments = await Assessment.find({ qa: qaId }).sort({ createdAt: -1 });
      return res.status(200).json({ assessments });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const assessment = await Assessment.findById(req.params.id).populate('qa', 'name email');
      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }
      return res.status(200).json({ assessment });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async listAll(req: AuthenticatedRequest, res: Response) {
    try {
      const assessments = await Assessment.find().populate('qa', 'name email').sort({ createdAt: -1 });
      return res.status(200).json({ assessments });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async triggerManual(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const assessment = await AssessmentService.triggerManualAssessment(req.params.qaId);
      return res.status(200).json({ assessment });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default AssessmentController;
