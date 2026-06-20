"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementController = void 0;
const RequirementService_1 = require("../services/RequirementService");
const AssignmentService_1 = require("../services/AssignmentService");
const RequirementChecklistService_1 = require("../services/RequirementChecklistService");
const AiValidationService_1 = require("../services/AiValidationService");
const validation_1 = require("../utils/validation");
class RequirementController {
    static async create(req, res) {
        try {
            const parsed = validation_1.requirementSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user || (req.user.role !== 'CLIENT' && req.user.role !== 'ADMIN')) {
                return res.status(403).json({ message: 'Access denied' });
            }
            const requirement = await RequirementService_1.RequirementService.createRequirement(req.user.id, parsed.data);
            return res.status(201).json({ requirement });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async list(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const requirements = await RequirementService_1.RequirementService.getRequirements(req.user.role, req.user.id);
            return res.status(200).json({ requirements });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const requirement = await RequirementService_1.RequirementService.getRequirementById(req.params.id);
            if (!requirement) {
                return res.status(404).json({ message: 'Requirement not found' });
            }
            return res.status(200).json({ requirement });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async assign(req, res) {
        try {
            const parsed = validation_1.assignSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const requirement = await AssignmentService_1.AssignmentService.assignQA(req.user.id, req.params.id, parsed.data.assignedQAId);
            return res.status(200).json({ requirement });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getChecklist(req, res) {
        try {
            const checklist = await RequirementChecklistService_1.RequirementChecklistService.getChecklist(req.params.id);
            if (!checklist) {
                return res.status(404).json({ message: 'Checklist not found' });
            }
            return res.status(200).json({ checklist });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async updateChecklist(req, res) {
        try {
            if (!Array.isArray(req.body.items)) {
                return res.status(400).json({ message: 'Items array is required' });
            }
            const checklist = await RequirementChecklistService_1.RequirementChecklistService.updateChecklistItems(req.params.id, req.body.items);
            return res.status(200).json({ checklist });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async evaluateQuality(req, res) {
        try {
            const evaluation = await AiValidationService_1.AiValidationService.evaluateRequirementQuality(req.params.id);
            return res.status(200).json(evaluation);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.RequirementController = RequirementController;
exports.default = RequirementController;
