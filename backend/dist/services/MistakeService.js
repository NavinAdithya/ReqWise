"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistakeService = void 0;
const Mistake_1 = require("../models/Mistake");
const Requirement_1 = require("../models/Requirement");
const AssessmentService_1 = require("./AssessmentService");
const AuditService_1 = require("./AuditService");
class MistakeService {
    static async logMistake(adminId, data) {
        const requirement = await Requirement_1.Requirement.findById(data.requirementId);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        const mistake = new Mistake_1.Mistake({
            qa: data.qaId,
            requirement: data.requirementId,
            project: requirement.project,
            category: requirement.category,
            mistakeType: data.mistakeType,
            severity: data.severity
        });
        await mistake.save();
        // Audit log
        await AuditService_1.AuditService.log(adminId, 'LOG_MISTAKE', 'Mistake', mistake._id, null, mistake.toJSON());
        // Evaluate triggers
        const triggeredAssessment = await AssessmentService_1.AssessmentService.evaluateMistakesAndTriggerAssessment(data.qaId);
        return { mistake, triggeredAssessment };
    }
}
exports.MistakeService = MistakeService;
exports.default = MistakeService;
