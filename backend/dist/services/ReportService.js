"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const Report_1 = require("../models/Report");
const Requirement_1 = require("../models/Requirement");
const ComparativeValidationService_1 = require("./ComparativeValidationService");
const RequirementService_1 = require("./RequirementService");
const NotificationService_1 = require("./NotificationService");
const AuditService_1 = require("./AuditService");
const User_1 = require("../models/User");
class ReportService {
    static async draftReport(qaId, requirementId, data) {
        const requirement = await Requirement_1.Requirement.findById(requirementId);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        if (requirement.assignedQA?.toString() !== qaId.toString()) {
            throw new Error('You are not assigned to this requirement');
        }
        // Move requirement status to UNDER_ANALYSIS if it was ASSIGNED or REVALIDATION
        if (requirement.status === 'ASSIGNED' || requirement.status === 'REVALIDATION') {
            await RequirementService_1.RequirementService.transitionStatus(qaId, requirementId, 'UNDER_ANALYSIS');
        }
        // Run the Comparative Validation engine
        const validationResult = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId, data);
        let report = await Report_1.Report.findOne({ requirement: requirementId, qa: qaId });
        if (report) {
            report.summary = data.summary;
            report.missingFeatures = data.missingFeatures;
            report.risks = data.risks;
            report.comments = data.comments;
            report.validationResult = validationResult._id;
            await report.save();
        }
        else {
            report = new Report_1.Report({
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
        await RequirementService_1.RequirementService.transitionStatus(qaId, requirementId, 'REPORT_GENERATED');
        return report;
    }
    static async submitReport(qaId, reportId) {
        const report = await Report_1.Report.findById(reportId);
        if (!report) {
            throw new Error('Report not found');
        }
        if (report.qa.toString() !== qaId.toString()) {
            throw new Error('Not authorized to submit this report');
        }
        report.status = 'SUBMITTED';
        await report.save();
        // Transition Requirement from REPORT_GENERATED to UNDER_REVIEW
        await RequirementService_1.RequirementService.transitionStatus(qaId, report.requirement, 'UNDER_REVIEW');
        // Notify Admins
        const admins = await User_1.User.find({ role: 'ADMIN' });
        for (const admin of admins) {
            await NotificationService_1.NotificationService.notify(admin._id, 'REVIEW', `QA has submitted a report for review on requirement: "${reportId}"`);
        }
        // Audit Log
        await AuditService_1.AuditService.log(qaId, 'SUBMIT_REPORT', 'Report', report._id, { status: 'DRAFT' }, { status: 'SUBMITTED' });
        return report;
    }
    static async getReportByRequirement(requirementId) {
        return Report_1.Report.findOne({ requirement: requirementId }).populate('qa', 'name email').populate('validationResult');
    }
}
exports.ReportService = ReportService;
exports.default = ReportService;
