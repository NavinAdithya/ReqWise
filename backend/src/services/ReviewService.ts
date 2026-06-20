import { Types } from 'mongoose';
import { Report } from '../models/Report';
import { Requirement } from '../models/Requirement';
import { ReviewDecision, ClientDecisionType } from '../models/ReviewDecision';
import { RequirementService } from './RequirementService';
import { NotificationService } from './NotificationService';
import { AuditService } from './AuditService';
import { RequirementChecklistService } from './RequirementChecklistService';

export class ReviewService {
  static async reviewReport(
    adminId: string | Types.ObjectId,
    reportId: string | Types.ObjectId,
    action: 'APPROVE' | 'REJECT' | 'SEND_TO_CLIENT',
    feedback?: string
  ) {
    const report = await Report.findById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const requirement = await Requirement.findById(report.requirement);
    if (!requirement) {
      throw new Error('Requirement associated with report not found');
    }

    if (requirement.status !== 'UNDER_REVIEW') {
      throw new Error('Requirement is not under review');
    }

    const oldReportStatus = report.status;
    
    if (action === 'APPROVE') {
      report.status = 'APPROVED_INTERNAL';
      report.adminFeedback = feedback;
      await report.save();

      // Audit Log
      await AuditService.log(
        adminId,
        'APPROVE_REPORT_INTERNAL',
        'Report',
        report._id,
        { status: oldReportStatus, adminFeedback: undefined },
        { status: report.status, adminFeedback: feedback }
      );
    } else if (action === 'SEND_TO_CLIENT') {
      report.status = 'SENT_TO_CLIENT';
      report.adminFeedback = feedback;
      await report.save();

      // Move requirement status to CLIENT_REVIEW
      await RequirementService.transitionStatus(adminId, requirement._id, 'CLIENT_REVIEW');

      // Notify the Client
      await NotificationService.notify(
        requirement.client,
        'CLIENT_DECISION',
        `The requirement review for "${requirement.title}" has been completed by Admin and is ready for your final decision.`
      );

      // Audit Log
      await AuditService.log(
        adminId,
        'SEND_REPORT_TO_CLIENT',
        'Report',
        report._id,
        { status: oldReportStatus, adminFeedback: undefined },
        { status: report.status, adminFeedback: feedback }
      );
    } else {
      report.status = 'REJECTED';
      report.adminFeedback = feedback;
      await report.save();

      // Move requirement status to REVALIDATION
      await RequirementService.transitionStatus(adminId, requirement._id, 'REVALIDATION');

      // Notify the QA
      if (requirement.assignedQA) {
        await NotificationService.notify(
          requirement.assignedQA,
          'REVIEW',
          `Your report for requirement: "${requirement.title}" was rejected by Admin with feedback: "${feedback || ''}"`
        );
      }

      // Audit Log
      await AuditService.log(
        adminId,
        'REJECT_REPORT',
        'Report',
        report._id,
        { status: oldReportStatus, adminFeedback: undefined },
        { status: report.status, adminFeedback: feedback }
      );
    }

    return report;
  }

  static async clientDecision(
    clientId: string | Types.ObjectId,
    requirementId: string | Types.ObjectId,
    data: {
      decision: ClientDecisionType;
      comments?: string;
      modifiedTitle?: string;
      modifiedDescription?: string;
    }
  ) {
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      throw new Error('Requirement not found');
    }

    if (requirement.client.toString() !== clientId.toString()) {
      throw new Error('You are not authorized to make decisions on this requirement');
    }

    if (requirement.status !== 'CLIENT_REVIEW') {
      throw new Error('Requirement is not in client review status');
    }

    const decisionRecord = new ReviewDecision({
      requirementId: requirement._id,
      decision: data.decision,
      comments: data.comments
    });

    if (data.decision === 'ACCEPT') {
      requirement.status = 'FINALIZED';
      await requirement.save();

      // Notify Admin and QA
      await NotificationService.notify(
        requirement.client, // client notified as well
        'CLIENT_DECISION',
        `Requirement "${requirement.title}" accepted and finalized.`
      );
      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        await NotificationService.notify(
          admin._id,
          'CLIENT_DECISION',
          `Client accepted and finalized requirement: "${requirement.title}"`
        );
      }
      if (requirement.assignedQA) {
        await NotificationService.notify(
          requirement.assignedQA,
          'CLIENT_DECISION',
          `Client accepted and finalized requirement: "${requirement.title}"`
        );
      }

      await AuditService.log(clientId, 'CLIENT_ACCEPT', 'Requirement', requirement._id, { status: 'CLIENT_REVIEW' }, { status: 'FINALIZED' });
    } else if (data.decision === 'REJECT_KEEP_ORIGINAL') {
      // Client chose to keep original, cancel the QA process
      requirement.status = 'CANCELED';
      await requirement.save();

      // Notify Admin and QA
      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        await NotificationService.notify(
          admin._id,
          'CLIENT_DECISION',
          `Client canceled requirement by keeping original version: "${requirement.title}". Reason: ${data.comments || 'No comment provided'}`
        );
      }
      if (requirement.assignedQA) {
        await NotificationService.notify(
          requirement.assignedQA,
          'CLIENT_DECISION',
          `Client canceled requirement by keeping original version: "${requirement.title}".`
        );
      }

      await AuditService.log(clientId, 'CLIENT_REJECT_KEEP_ORIGINAL', 'Requirement', requirement._id, { status: 'CLIENT_REVIEW' }, { status: 'CANCELED' });
    } else if (data.decision === 'REJECT_RECOMMENDATION') {
      // Revert status to REVALIDATION
      requirement.status = 'REVALIDATION';
      await requirement.save();

      if (requirement.assignedQA) {
        await NotificationService.notify(
          requirement.assignedQA,
          'CLIENT_DECISION',
          `Client rejected recommendations for "${requirement.title}". Re-validation required.`
        );
      }

      await AuditService.log(clientId, 'CLIENT_REJECT_RECOMMENDATION', 'Requirement', requirement._id, { status: 'CLIENT_REVIEW' }, { status: 'REVALIDATION' });
    } else if (data.decision === 'MODIFY_VERSION') {
      if (!data.modifiedTitle || !data.modifiedDescription) {
        throw new Error('Modified title and description are required for version modifications');
      }

      // Create a new version of the requirement
      const newVersion = new Requirement({
        title: data.modifiedTitle,
        description: data.modifiedDescription,
        client: requirement.client,
        assignedQA: requirement.assignedQA,
        category: requirement.category,
        project: requirement.project,
        version: requirement.version + 1,
        originalRequirementId: requirement.originalRequirementId || requirement._id,
        parentVersionId: requirement._id,
        status: requirement.assignedQA ? 'ASSIGNED' : 'DRAFT'
      });

      await newVersion.save();
      await RequirementChecklistService.initializeChecklist(newVersion._id, {
        title: newVersion.title,
        description: newVersion.description,
        category: newVersion.category
      });

      decisionRecord.modifiedVersion = newVersion._id as Types.ObjectId;

      // Finalize the current version
      requirement.status = 'FINALIZED';
      await requirement.save();

      // Notify QA of new version
      if (newVersion.assignedQA) {
        await NotificationService.notify(
          newVersion.assignedQA,
          'ASSIGNMENT',
          `A new modified version v${newVersion.version} of "${newVersion.title}" has been uploaded. Re-validation required.`
        );
      }

      await AuditService.log(clientId, 'CLIENT_MODIFY_VERSION', 'Requirement', requirement._id, { status: 'CLIENT_REVIEW' }, { status: 'FINALIZED', newVersionId: newVersion._id });
    } else if (data.decision === 'MODIFY_FINALIZE') {
      if (!data.modifiedTitle || !data.modifiedDescription) {
        throw new Error('Modified title and description are required to modify and finalize');
      }

      requirement.title = data.modifiedTitle;
      requirement.description = data.modifiedDescription;
      requirement.status = 'FINALIZED';
      await requirement.save();

      await AuditService.log(
        clientId,
        'CLIENT_MODIFY_FINALIZE',
        'Requirement',
        requirement._id,
        { status: 'CLIENT_REVIEW' },
        { status: 'FINALIZED', title: data.modifiedTitle, description: data.modifiedDescription }
      );
    }

    await decisionRecord.save();
    return { decision: decisionRecord, requirement };
  }
}

// Ensure User is imported dynamically since it's referenced
import { User } from '../models/User';
export default ReviewService;

