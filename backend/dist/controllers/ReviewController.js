"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const ReviewService_1 = require("../services/ReviewService");
const AiValidationService_1 = require("../services/AiValidationService");
const validation_1 = require("../utils/validation");
class ReviewController {
    static async reviewReport(req, res) {
        try {
            const parsed = validation_1.reviewReportSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const report = await ReviewService_1.ReviewService.reviewReport(req.user.id, parsed.data.reportId, parsed.data.action, parsed.data.feedback);
            return res.status(200).json({ report });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async clientDecision(req, res) {
        try {
            const parsed = validation_1.clientDecisionSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await ReviewService_1.ReviewService.clientDecision(req.user.id, parsed.data.requirementId, parsed.data);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async runComparativeAnalysis(req, res) {
        try {
            const { reportId } = req.params;
            if (!reportId || !/^[0-9a-fA-F]{24}$/.test(reportId)) {
                return res.status(400).json({ message: 'Invalid report ID' });
            }
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await AiValidationService_1.AiValidationService.runComparativeAnalysis(reportId);
            return res.status(200).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.ReviewController = ReviewController;
exports.default = ReviewController;
