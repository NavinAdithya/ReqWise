import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { RequirementService } from '../services/RequirementService';
import { AssignmentService } from '../services/AssignmentService';
import { RequirementChecklistService } from '../services/RequirementChecklistService';
import { AiValidationService } from '../services/AiValidationService';
import { requirementSchema, assignSchema } from '../utils/validation';

export class RequirementController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = requirementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user || (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN')) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const requirement = await RequirementService.createRequirement(req.user.id, parsed.data);
      return res.status(201).json({ requirement });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const requirements = await RequirementService.getRequirements(req.user.role, req.user.id);
      return res.status(200).json({ requirements });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const requirement = await RequirementService.getRequirementById(req.params.id);
      if (!requirement) {
        return res.status(404).json({ message: 'Requirement not found' });
      }
      return res.status(200).json({ requirement });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async assign(req: AuthenticatedRequest, res: Response) {
    try {
      const parsed = assignSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const requirement = await AssignmentService.assignQA(req.user.id, req.params.id, parsed.data.assignedQAId);
      return res.status(200).json({ requirement });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async getChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const checklist = await RequirementChecklistService.getChecklist(req.params.id);
      if (!checklist) {
        return res.status(404).json({ message: 'Checklist not found' });
      }
      return res.status(200).json({ checklist });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async updateChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      if (!Array.isArray(req.body.items)) {
        return res.status(400).json({ message: 'Items array is required' });
      }
      const checklist = await RequirementChecklistService.updateChecklistItems(req.params.id, req.body.items);
      return res.status(200).json({ checklist });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  static async evaluateQuality(req: AuthenticatedRequest, res: Response) {
    try {
      const evaluation = await AiValidationService.evaluateRequirementQuality(req.params.id);
      return res.status(200).json(evaluation);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default RequirementController;
