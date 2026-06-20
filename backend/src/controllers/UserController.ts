import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Report } from '../models/Report';
import { Mistake } from '../models/Mistake';
import { Assessment } from '../models/Assessment';
import { Requirement } from '../models/Requirement';

export class UserController {
  static async getQAPerformance(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const qas = await User.find({ role: 'QA' }).select('-password');
      
      const performanceData = await Promise.all(qas.map(async (qa) => {
        // 1. Report Quality
        const reports = await Report.find({ qa: qa._id, status: { $ne: 'DRAFT' } });
        const totalReports = reports.length;
        const approvedReports = reports.filter(r => ['APPROVED', 'APPROVED_INTERNAL', 'SENT_TO_CLIENT'].includes(r.status)).length;
        const reportQuality = totalReports === 0 ? 100 : (approvedReports / totalReports) * 100;

        // 2. Mistake Performance
        const mistakes = await Mistake.find({ qa: qa._id });
        let mistakePenalty = 0;
        mistakes.forEach(m => {
          if (m.severity === 'LOW') mistakePenalty += 1;
          else if (m.severity === 'MEDIUM') mistakePenalty += 3;
          else if (m.severity === 'HIGH') mistakePenalty += 5;
        });
        const mistakePerformance = Math.max(0, 100 - mistakePenalty);

        // 3. Assessment Score
        const assessments = await Assessment.find({ qa: qa._id, status: 'COMPLETED' });
        const totalAssessments = assessments.length;
        const totalScore = assessments.reduce((sum, a) => sum + (a.score || 0), 0);
        const assessmentScore = totalAssessments === 0 ? 100 : (totalScore / totalAssessments);

        // Active Reviews
        const activeReviews = await Requirement.find({ assignedQA: qa._id, status: 'UNDER_ANALYSIS' }).select('title project category status');

        // Calculate Accuracy %
        // (Report Quality × 50%) + (Mistake Performance × 30%) + (Assessment Score × 20%)
        const accuracy = (reportQuality * 0.5) + (mistakePerformance * 0.3) + (assessmentScore * 0.2);

        return {
          qa: {
            _id: qa._id,
            name: qa.name,
            email: qa.email
          },
          accuracy: Math.round(accuracy),
          stats: {
            assigned: totalReports, // Approximation: could query Requirements assigned
            submitted: totalReports,
            approved: approvedReports,
            rejected: reports.filter(r => r.status === 'REJECTED').length
          },
          mistakes,
          assessments,
          activeReviews
        };
      }));

      return res.status(200).json({ data: performanceData });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}
export default UserController;
