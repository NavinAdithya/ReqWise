import { Types } from 'mongoose';
import { RequirementChecklistService } from './RequirementChecklistService';

export class CoverageService {
  static async calculateCoverage(requirementId: string | Types.ObjectId): Promise<number> {
    const checklist = await RequirementChecklistService.getChecklist(requirementId);
    if (!checklist || checklist.items.length === 0) {
      return 0;
    }
    const points = checklist.items.reduce((sum, item) => {
      if (item.result === 'Pass') return sum + 1;
      if (item.result === 'N/S') return sum + 0.5;
      return sum;
    }, 0);
    return Math.round((points / checklist.items.length) * 100);
  }
}
export default CoverageService;
