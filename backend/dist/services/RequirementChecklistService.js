"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementChecklistService = void 0;
const RequirementChecklist_1 = require("../models/RequirementChecklist");
const RequirementService_1 = require("./RequirementService");
class RequirementChecklistService {
    static generateChecklist(context) {
        const items = [];
        const category = context.category;
        const fixedCriteria = [
            'Requirement is clear',
            'Requirement is complete',
            'No missing information',
            'No contradiction found',
            'Test cases can be created',
            'Requirement is understandable'
        ];
        fixedCriteria.forEach(text => {
            items.push({
                text,
                section: 'Quality Checklist',
                category,
                result: 'N/S'
            });
        });
        return items;
    }
    static async initializeChecklist(requirementId, context) {
        const items = this.generateChecklist(context);
        return RequirementChecklist_1.RequirementChecklist.create({
            requirement: requirementId,
            items,
            checklistVersion: 2
        });
    }
    static async getChecklist(requirementId) {
        let checklist = await RequirementChecklist_1.RequirementChecklist.findOne({ requirement: requirementId });
        if (!checklist) {
            const context = await RequirementService_1.RequirementService.extractChecklistContext(requirementId);
            checklist = await this.initializeChecklist(requirementId, context);
        }
        else if (checklist.checklistVersion !== 2) {
            const context = await RequirementService_1.RequirementService.extractChecklistContext(requirementId);
            const items = this.generateChecklist(context);
            checklist.items = items;
            checklist.checklistVersion = 2;
            await checklist.save();
        }
        return checklist;
    }
    static async updateChecklistItems(requirementId, items) {
        let checklist = await RequirementChecklist_1.RequirementChecklist.findOne({ requirement: requirementId });
        if (!checklist) {
            checklist = new RequirementChecklist_1.RequirementChecklist({ requirement: requirementId, items: [], checklistVersion: 2 });
        }
        // Map items, preserving section and category from the database if they are not provided
        checklist.items = items.map((updatedItem) => {
            const existing = checklist?.items.find(i => i.text === updatedItem.text);
            return {
                text: updatedItem.text,
                result: updatedItem.result || 'N/S',
                section: updatedItem.section || existing?.section,
                category: updatedItem.category || existing?.category
            };
        });
        checklist.checklistVersion = 2;
        await checklist.save();
        return checklist;
    }
}
exports.RequirementChecklistService = RequirementChecklistService;
exports.default = RequirementChecklistService;
