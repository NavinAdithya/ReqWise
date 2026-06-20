import { request } from './api';
import type { Report, ValidationResult } from '../types';

export interface DraftReportPayload {
  requirementId: string;
  summary: string;
  missingFeatures: string[];
  risks: string[];
  comments?: string;
}

export const reportService = {
  draftReport: async (data: DraftReportPayload): Promise<{ report: Report }> => {
    return request<{ report: Report }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  submitReport: async (id: string): Promise<{ report: Report }> => {
    return request<{ report: Report }>(`/reports/${id}/submit`, {
      method: 'POST'
    });
  },

  getReportByRequirement: async (requirementId: string): Promise<{ report: Report | null; validationResult?: ValidationResult | null }> => {
    return request<{ report: Report | null; validationResult?: ValidationResult | null }>(`/reports/requirement/${requirementId}`);
  },

  runValidation: async (requirementId: string, qaFindings?: QAFindingsPayload, modifiedDescription?: string): Promise<{ validationResult: ValidationResult }> => {
    return request<{ validationResult: ValidationResult }>('/reports/validation/run', {
      method: 'POST',
      body: JSON.stringify({ requirementId, qaFindings, modifiedDescription })
    });
  },

  aiValidateReport: async (reportId: string): Promise<{ aiResult: any }> => {
    return request<{ aiResult: any }>(`/reports/${reportId}/ai-validate`, {
      method: 'POST'
    });
  }
};
export default reportService;
