import { request } from './api';
import type { Report, Requirement, ReviewDecision } from '../types';

export interface ReviewReportPayload {
  reportId: string;
  action: 'APPROVE' | 'REJECT' | 'SEND_TO_CLIENT';
  feedback?: string;
}

export interface ClientDecisionPayload {
  requirementId: string;
  decision: 'ACCEPT' | 'REJECT_KEEP_ORIGINAL' | 'REJECT_RECOMMENDATION' | 'MODIFY_VERSION' | 'MODIFY_FINALIZE';
  comments?: string;
  modifiedTitle?: string;
  modifiedDescription?: string;
}

export const reviewService = {
  reviewReport: async (data: ReviewReportPayload): Promise<{ report: Report }> => {
    return request<{ report: Report }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  clientDecision: async (data: ClientDecisionPayload): Promise<{ decision: ReviewDecision; requirement: Requirement }> => {
    return request<{ decision: ReviewDecision; requirement: Requirement }>('/reviews/client/decision', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  runComparativeAnalysis: async (reportId: string): Promise<any> => {
    return request<any>(`/reviews/${reportId}/comparative-analysis`, {
      method: 'GET'
    });
  }
};
export default reviewService;
