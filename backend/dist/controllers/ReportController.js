"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const ReportService_1 = require("../services/ReportService");
const ComparativeValidationService_1 = require("../services/ComparativeValidationService");
const AiValidationService_1 = require("../services/AiValidationService");
const validation_1 = require("../utils/validation");
const ValidationResult_1 = require("../models/ValidationResult");
class ReportController {
    static async runValidation(req, res) {
        try {
            const { requirementId, qaFindings } = req.body;
            if (!requirementId) {
                return res.status(400).json({ message: 'requirementId is required' });
            }
            const result = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId, qaFindings);
            return res.status(200).json({ validationResult: result });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async draft(req, res) {
        try {
            const parsed = validation_1.draftReportSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const report = await ReportService_1.ReportService.draftReport(req.user.id, parsed.data.requirementId, parsed.data);
            return res.status(200).json({ report });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async submit(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const report = await ReportService_1.ReportService.submitReport(req.user.id, req.params.id);
            return res.status(200).json({ report });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getByRequirement(req, res) {
        try {
            const report = await ReportService_1.ReportService.getReportByRequirement(req.params.id);
            const latestVal = await ValidationResult_1.ValidationResult.findOne({ requirement: req.params.id, isActive: true });
            if (!report && !latestVal) {
                return res.status(404).json({ message: 'No report or validation result found for this requirement' });
            }
            return res.status(200).json({
                report: report || null,
                validationResult: latestVal || null
            });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async aiValidate(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Only Admins can run AI validation' });
            }
            const aiResult = await AiValidationService_1.AiValidationService.validateReport(req.params.id);
            return res.status(200).json({ aiResult });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.ReportController = ReportController;
exports.default = ReportController;
