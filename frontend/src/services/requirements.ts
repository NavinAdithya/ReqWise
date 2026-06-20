import { request } from './api';
import type { Requirement, RequirementChecklist, ChecklistItem, AIQualityEvaluation } from '../types';

export const requirementService = {
  getRequirements: async (): Promise<{ requirements: Requirement[] }> => {
    return request<{ requirements: Requirement[] }>('/requirements');
  },

  getRequirementById: async (id: string): Promise<{ requirement: Requirement }> => {
    return request<{ requirement: Requirement }>(`/requirements/${id}`);
  },

  createRequirement: async (data: { title: string; description: string; category: string; project: string }): Promise<{ requirement: Requirement }> => {
    return request<{ requirement: Requirement }>('/requirements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  assignQA: async (id: string, assignedQAId: string): Promise<{ requirement: Requirement }> => {
    return request<{ requirement: Requirement }>(`/requirements/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedQAId })
    });
  },

  getChecklist: async (id: string): Promise<{ checklist: RequirementChecklist }> => {
    return request<{ checklist: RequirementChecklist }>(`/requirements/${id}/checklist`);
  },

  updateChecklist: async (id: string, items: ChecklistItem[]): Promise<{ checklist: RequirementChecklist }> => {
    return request<{ checklist: RequirementChecklist }>(`/requirements/${id}/checklist`, {
      method: 'PUT',
      body: JSON.stringify({ items })
    });
  },

  evaluateQuality: async (id: string): Promise<AIQualityEvaluation> => {
    return request<AIQualityEvaluation>(`/requirements/${id}/quality-gate`, {
      method: 'GET'
    });
  }
};
export default requirementService;
