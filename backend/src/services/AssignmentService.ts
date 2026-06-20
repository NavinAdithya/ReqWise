import { Types } from 'mongoose';
import { Requirement } from '../models/Requirement';
import { User } from '../models/User';
import { RequirementService } from './RequirementService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';

export class AssignmentService {
  static async assignQA(
    adminId: string | Types.ObjectId,
    requirementId: string | Types.ObjectId,
    qaId: string | Types.ObjectId
  ) {
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.status !== 'DRAFT') {
      throw new Error('Can only assign QA to requirements in DRAFT status');
    }

    const qaUser = await User.findById(qaId);
    if (!qaUser || qaUser.role !== 'QA') {
      throw new Error('Invalid user or user is not a QA member');
    }

    const oldQA = requirement.assignedQA;
    requirement.assignedQA = new Types.ObjectId(qaId.toString());
    requirement.status = 'ASSIGNED';
    await requirement.save();

    // Audit Log
    await AuditService.log(
      adminId,
      'ASSIGN_QA',
      'Requirement',
      requirement._id,
      { assignedQA: oldQA, status: 'DRAFT' },
      { assignedQA: qaId, status: 'ASSIGNED' }
    );

    // Notify the QA
    await NotificationService.notify(
      qaId,
      'ASSIGNMENT',
      `You have been assigned to analyze the requirement: "${requirement.title}"`
    );

    return requirement;
  }
}
export default AssignmentService;
