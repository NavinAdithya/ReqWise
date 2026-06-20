"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementService = void 0;
const Requirement_1 = require("../models/Requirement");
const RequirementChecklistService_1 = require("./RequirementChecklistService");
const AuditService_1 = require("./AuditService");
class RequirementService {
    static async createRequirement(clientId, data) {
        const requirement = new Requirement_1.Requirement({
            ...data,
            client: clientId,
            status: 'DRAFT',
            version: 1
        });
        await requirement.save();
        // Initialize the checklist for this requirement category
        await RequirementChecklistService_1.RequirementChecklistService.initializeChecklist(requirement._id, {
            title: requirement.title,
            description: requirement.description,
            category: requirement.category
        });
        // Audit Log
        await AuditService_1.AuditService.log(clientId, 'CREATE_REQUIREMENT', 'Requirement', requirement._id, null, requirement.toJSON());
        return requirement;
    }
    static async getRequirements(role, userId) {
        const filter = {};
        if (role === 'CLIENT') {
            filter.client = userId;
        }
        else if (role === 'QA') {
            filter.assignedQA = userId;
        }
        return Requirement_1.Requirement.find(filter).populate('client', 'name email').populate('assignedQA', 'name email').sort({ updatedAt: -1 });
    }
    static async getRequirementById(id) {
        return Requirement_1.Requirement.findById(id).populate('client', 'name email').populate('assignedQA', 'name email');
    }
    static async extractChecklistContext(id) {
        const req = await Requirement_1.Requirement.findById(id);
        if (!req) {
            throw new Error('Requirement not found');
        }
        return {
            title: req.title,
            description: req.description,
            category: req.category
        };
    }
    static async transitionStatus(actorId, requirementId, newStatus) {
        const requirement = await Requirement_1.Requirement.findById(requirementId);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        const oldStatus = requirement.status;
        this.validateTransition(oldStatus, newStatus);
        requirement.status = newStatus;
        await requirement.save();
        // Audit Log
        await AuditService_1.AuditService.log(actorId, 'TRANSITION_STATUS', 'Requirement', requirement._id, { status: oldStatus }, { status: newStatus });
        return requirement;
    }
    static validateTransition(current, next) {
        const allowedTransitions = {
            DRAFT: ['ASSIGNED'],
            ASSIGNED: ['UNDER_ANALYSIS'],
            UNDER_ANALYSIS: ['REPORT_GENERATED'],
            REPORT_GENERATED: ['UNDER_REVIEW'],
            UNDER_REVIEW: ['CLIENT_REVIEW', 'REVALIDATION'],
            CLIENT_REVIEW: ['FINALIZED', 'REVALIDATION', 'DRAFT', 'ASSIGNED'], // DRAFT/ASSIGNED occurs if versioned/modified
            REVALIDATION: ['UNDER_ANALYSIS'],
            FINALIZED: []
        };
        const allowed = allowedTransitions[current] || [];
        if (!allowed.includes(next)) {
            throw new Error(`Invalid status transition from ${current} to ${next}`);
        }
    }
}
exports.RequirementService = RequirementService;
exports.default = RequirementService;
