import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReportService } from '../services/ReportService';
import { ComparativeValidationService } from '../services/ComparativeValidationService';
import { AiValidationService } from '../services/AiValidationService';
import { draftReportSchema } from '../utils/validation';
import { ValidationResult } from '../models/ValidationResult';

export class ReportController {
  static async runValidation(req: AuthenticatedRequest, res: Response) {
    try {
      const { requirementId, qaFindings, modifiedDescription } = req.body;
      if (!requirementId) {
        return res.status(400).json({ message: 'requirementId is required' });
      }

      const result = await ComparativeValidationService.runValidation(requirementId, qaFindings, modifiedDescription);
      return res.status(200).json({ validationResult: result });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async draft(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = draftReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const report = await ReportService.draftReport(req.user.id, parsed.data.requirementId, parsed.data);
      return res.status(200).json({ report });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async submit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const report = await ReportService.submitReport(req.user.id, req.params.id);
      return res.status(200).json({ report });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async getByRequirement(req: AuthenticatedRequest, res: Response) {
    try {
      const report = await ReportService.getReportByRequirement(req.params.id);
      const latestVal = await ValidationResult.findOne({ requirement: req.params.id, isActive: true });
      
      if (!report && !latestVal) {
        return res.status(404).json({ message: 'No report or validation result found for this requirement' });
      }
      return res.status(200).json({
        report: report || null,
        validationResult: latestVal || null
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async aiValidate(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only Admins can run AI validation' });
      }

      const aiResult = await AiValidationService.validateReport(req.params.id);
      return res.status(200).json({ aiResult });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default ReportController;
