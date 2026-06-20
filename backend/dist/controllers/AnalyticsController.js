"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const Requirement_1 = require("../models/Requirement");
const Mistake_1 = require("../models/Mistake");
const Assessment_1 = require("../models/Assessment");
class AnalyticsController {
    static async getDashboardData(req, res) {
        try {
            // 1. Requirements by Status
            const requirementsByStatus = await Requirement_1.Requirement.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { status: '$_id', count: 1, _id: 0 } }
            ]);
            // 2. Mistakes by Category
            const mistakesByCategory = await Mistake_1.Mistake.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $project: { category: '$_id', count: 1, _id: 0 } }
            ]);
            // 3. Mistakes by Type
            const mistakesByType = await Mistake_1.Mistake.aggregate([
                { $group: { _id: '$mistakeType', count: { $sum: 1 } } },
                { $project: { mistakeType: '$_id', count: 1, _id: 0 } }
            ]);
            // 4. QA Performance Assessments (completed vs pending)
            const assessmentsSummary = await Assessment_1.Assessment.find()
                .populate('qa', 'name email')
                .select('qa score status totalWeight completedAt')
                .sort({ score: -1 });
            const qaAssessments = assessmentsSummary.map((a) => ({
                qaName: a.qa ? a.qa.name : 'Unknown',
                score: a.score,
                status: a.status,
                totalWeight: a.totalWeight,
                completedAt: a.completedAt
            }));
            return res.status(200).json({
                requirementsByStatus,
                mistakesByCategory,
                mistakesByType,
                qaAssessments
            });
        }
        catch (error) {
            return res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
exports.default = AnalyticsController;
