import { Types } from 'mongoose';
import { Requirement, IRequirement, RequirementStatus } from '../models/Requirement';
import { RequirementChecklistService } from './RequirementChecklistService';
import { AuditService } from './AuditService';
import { NotificationService } from './NotificationService';

export class RequirementService {
  static async createRequirement(
    clientId: string | Types.ObjectId,
    data: { title: string; description: string; category: string; project: string }
  ): Promise<IRequirement> {
    const requirement = new Requirement({
      ...data,
      client: clientId,
      status: 'DRAFT',
      version: 1
    });

    await requirement.save();

    // Initialize the checklist for this requirement category
    await RequirementChecklistService.initializeChecklist(requirement._id, {
      title: requirement.title,
      description: requirement.description,
      category: requirement.category
    });

    // Audit Log
    await AuditService.log(clientId, 'CREATE_REQUIREMENT', 'Requirement', requirement._id, null, requirement.toJSON());

    return requirement;
  }

  static async getRequirements(role: 'ADMIN' | 'QA' | 'CLIENT', userId: string | Types.ObjectId): Promise<IRequirement[]> {
    const filter: any = {};
    if (role === 'CLIENT') {
      filter.client = userId;
    } else if (role === 'QA') {
      filter.assignedQA = userId;
    }
    return Requirement.find(filter).populate('client', 'name email').populate('assignedQA', 'name email').sort({ updatedAt: -1 });
  }

  static async getRequirementById(id: string | Types.ObjectId): Promise<IRequirement | null> {
    return Requirement.findById(id).populate('client', 'name email').populate('assignedQA', 'name email');
  }

  static async extractChecklistContext(id: string | Types.ObjectId): Promise<{ title: string; description: string; category: string }> {
    const req = await Requirement.findById(id);
    if (!req) {
      throw new Error('Requirement not found');
    }
    return {
      title: req.title,
      description: req.description,
      category: req.category
    };
  }

  static async transitionStatus(
    actorId: string | Types.ObjectId,
    requirementId: string | Types.ObjectId,
    newStatus: RequirementStatus
  ): Promise<IRequirement> {
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    const oldStatus = requirement.status;
    this.validateTransition(oldStatus, newStatus);

    requirement.status = newStatus;
    await requirement.save();

    // Audit Log
    await AuditService.log(actorId, 'TRANSITION_STATUS', 'Requirement', requirement._id, { status: oldStatus }, { status: newStatus });

    return requirement;
  }

  private static validateTransition(current: RequirementStatus, next: RequirementStatus): void {
    const allowedTransitions: Record<RequirementStatus, RequirementStatus[]> = {
      DRAFT: ['ASSIGNED', 'CANCELED'],
      ASSIGNED: ['UNDER_ANALYSIS', 'CANCELED'],
      UNDER_ANALYSIS: ['REPORT_GENERATED', 'CANCELED'],
      REPORT_GENERATED: ['UNDER_REVIEW', 'CANCELED'],
      UNDER_REVIEW: ['CLIENT_REVIEW', 'REVALIDATION', 'CANCELED'],
      CLIENT_REVIEW: ['FINALIZED', 'REVALIDATION', 'DRAFT', 'ASSIGNED', 'CANCELED'],
      REVALIDATION: ['UNDER_ANALYSIS', 'CANCELED'],
      FINALIZED: [],
      CANCELED: []
    };

    const allowed = allowedTransitions[current] || [];
    if (!allowed.includes(next)) {
      throw new Error(`Invalid status transition from ${current} to ${next}`);
    }
  }
}
export default RequirementService;
