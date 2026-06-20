import { Types } from 'mongoose';
import { RequirementChecklist } from '../models/RequirementChecklist';
import { RequirementService } from './RequirementService';

export class RequirementChecklistService {
  static generateChecklist(context: { title: string; description: string; category: string }) {
    const items: { text: string; section: string; category: string; result: 'Pass' | 'Fail' | 'N/S' }[] = [];
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

  static async initializeChecklist(requirementId: string | Types.ObjectId, context: { title: string; description: string; category: string }) {
    const items = this.generateChecklist(context);
    return RequirementChecklist.create({
      requirement: requirementId,
      items,
      checklistVersion: 2
    });
  }

  static async getChecklist(requirementId: string | Types.ObjectId) {
    let checklist = await RequirementChecklist.findOne({ requirement: requirementId });
    if (!checklist) {
      const context = await RequirementService.extractChecklistContext(requirementId);
      checklist = await this.initializeChecklist(requirementId, context);
    } else if (checklist.checklistVersion !== 2) {
      const context = await RequirementService.extractChecklistContext(requirementId);
      const items = this.generateChecklist(context);
      checklist.items = items;
      checklist.checklistVersion = 2;
      await checklist.save();
    }
    return checklist;
  }

  static async updateChecklistItems(requirementId: string | Types.ObjectId, items: any[]) {
    let checklist = await RequirementChecklist.findOne({ requirement: requirementId });
    if (!checklist) {
      checklist = new RequirementChecklist({ requirement: requirementId, items: [], checklistVersion: 2 });
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

export default RequirementChecklistService;
