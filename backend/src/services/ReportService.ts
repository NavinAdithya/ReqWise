import { Types } from 'mongoose';
import { Report, IReport } from '../models/Report';
import { Requirement } from '../models/Requirement';
import { ComparativeValidationService } from './ComparativeValidationService';
import { RequirementService } from './RequirementService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';
import { User } from '../models/User';

export class ReportService {
  static async draftReport(
    qaId: string | Types.ObjectId,
    requirementId: string | Types.ObjectId,
    data: { summary: string; missingFeatures: string[]; risks: string[]; comments?: string }
  ): Promise<IReport> {
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.assignedQA?.toString() !== qaId.toString()) {
      throw new Error('You are not assigned to this requirement');
    }

    // Move requirement status to UNDER_ANALYSIS if it was ASSIGNED or REVALIDATION
    if (requirement.status === 'ASSIGNED' || requirement.status === 'REVALIDATION') {
      await RequirementService.transitionStatus(qaId, requirementId, 'UNDER_ANALYSIS');
    }

    // Run the Comparative Validation engine
    const validationResult = await ComparativeValidationService.runValidation(requirementId, data);

    let report = await Report.findOne({ requirement: requirementId, qa: qaId });
    if (report) {
      report.summary = data.summary;
      report.missingFeatures = data.missingFeatures;
      report.risks = data.risks;
      report.comments = data.comments;
      report.validationResult = validationResult._id as Types.ObjectId;
      await report.save();
    } else {
      report = new Report({
        requirement: requirementId,
        qa: qaId,
        summary: data.summary,
        missingFeatures: data.missingFeatures,
        risks: data.risks,
        comments: data.comments,
        validationResult: validationResult._id,
        status: 'DRAFT'
      });
      await report.save();
    }

    // Move requirement status to REPORT_GENERATED
    await RequirementService.transitionStatus(qaId, requirementId, 'REPORT_GENERATED');

    return report;
  }

  static async submitReport(qaId: string | Types.ObjectId, reportId: string | Types.ObjectId): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    if (report.qa.toString() !== qaId.toString()) {
      throw new Error('Not authorized to submit this report');
    }

    report.status = 'SUBMITTED';
    await report.save();

    // Transition Requirement from REPORT_GENERATED to UNDER_REVIEW
    await RequirementService.transitionStatus(qaId, report.requirement, 'UNDER_REVIEW');

    // Notify Admins
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await NotificationService.notify(
        admin._id,
        'REVIEW',
        `QA has submitted a report for review on requirement: "${reportId}"`
      );
    }

    // Audit Log
    await AuditService.log(qaId, 'SUBMIT_REPORT', 'Report', report._id, { status: 'DRAFT' }, { status: 'SUBMITTED' });

    return report;
  }

  static async getReportByRequirement(requirementId: string | Types.ObjectId) {
    return Report.findOne({ requirement: requirementId }).populate('qa', 'name email').populate('validationResult');
  }
}
export default ReportService;
