import { Types } from 'mongoose';
import { Mistake, IMistake, SeverityType } from '../models/Mistake';
import { Requirement } from '../models/Requirement';
import { AssessmentService } from './AssessmentService';
import { AuditService } from './AuditService';

export class MistakeService {
  static async logMistake(
    adminId: string | Types.ObjectId,
    data: {
      qaId: string | Types.ObjectId;
      requirementId: string | Types.ObjectId;
      mistakeType: string;
      severity: SeverityType;
    }
  ): Promise<{ mistake: IMistake; triggeredAssessment: any }> {
    const requirement = await Requirement.findById(data.requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    const mistake = new Mistake({
      qa: data.qaId,
      requirement: data.requirementId,
      project: requirement.project,
      category: requirement.category,
      mistakeType: data.mistakeType,
      severity: data.severity
    });

    await mistake.save();

    // Audit log
    await AuditService.log(
      adminId,
      'LOG_MISTAKE',
      'Mistake',
      mistake._id,
      null,
      mistake.toJSON()
    );

    // Evaluate triggers
    const triggeredAssessment = await AssessmentService.evaluateMistakesAndTriggerAssessment(data.qaId);

    return { mistake, triggeredAssessment };
  }
}
export default MistakeService;
