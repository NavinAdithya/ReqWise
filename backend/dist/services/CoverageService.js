"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoverageService = void 0;
const RequirementChecklistService_1 = require("./RequirementChecklistService");
class CoverageService {
    static async calculateCoverage(requirementId) {
        const checklist = await RequirementChecklistService_1.RequirementChecklistService.getChecklist(requirementId);
        if (!checklist || checklist.items.length === 0) {
            return 0;
        }
        const points = checklist.items.reduce((sum, item) => {
            if (item.result === 'Pass')
                return sum + 1;
            if (item.result === 'N/S')
                return sum + 0.5;
            return sum;
        }, 0);
        return Math.round((points / checklist.items.length) * 100);
    }
}
exports.CoverageService = CoverageService;
exports.default = CoverageService;
