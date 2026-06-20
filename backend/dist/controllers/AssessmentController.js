"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
const AssessmentService_1 = require("../services/AssessmentService");
const Assessment_1 = require("../models/Assessment");
const validation_1 = require("../utils/validation");
class AssessmentController {
    static async submitAnswers(req, res) {
        try {
            const parsed = validation_1.submitAssessmentSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const assessment = await AssessmentService_1.AssessmentService.submitAssessmentAnswers(req.user.id, parsed.data.assessmentId, parsed.data.answers);
            return res.status(200).json({ assessment });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getByQA(req, res) {
        try {
            const qaId = req.params.qaId;
            const assessments = await Assessment_1.Assessment.find({ qa: qaId }).sort({ createdAt: -1 });
            return res.status(200).json({ assessments });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async getById(req, res) {
        try {
            const assessment = await Assessment_1.Assessment.findById(req.params.id).populate('qa', 'name email');
            if (!assessment) {
                return res.status(404).json({ message: 'Assessment not found' });
            }
            return res.status(200).json({ assessment });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async listAll(req, res) {
        try {
            const assessments = await Assessment_1.Assessment.find().populate('qa', 'name email').sort({ createdAt: -1 });
            return res.status(200).json({ assessments });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async triggerManual(req, res) {
        try {
            if (!req.user || req.user.role !== 'ADMIN') {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const assessment = await AssessmentService_1.AssessmentService.triggerManualAssessment(req.params.qaId);
            return res.status(200).json({ assessment });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.AssessmentController = AssessmentController;
exports.default = AssessmentController;
