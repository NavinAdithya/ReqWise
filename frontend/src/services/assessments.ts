import { request } from './api';
import type { Assessment } from '../types';

export const assessmentService = {
  submitAnswers: async (assessmentId: string, answers: string[]): Promise<{ assessment: Assessment }> => {
    return request<{ assessment: Assessment }>('/assessments', {
      method: 'POST',
      body: JSON.stringify({ assessmentId, answers })
    });
  },

  getAssessmentsByQA: async (qaId: string): Promise<{ assessments: Assessment[] }> => {
    return request<{ assessments: Assessment[] }>(`/assessments/qa/${qaId}`);
  },

  getAssessmentById: async (id: string): Promise<{ assessment: Assessment }> => {
    return request<{ assessment: Assessment }>(`/assessments/${id}`);
  },

  getAllAssessments: async (): Promise<{ assessments: Assessment[] }> => {
    return request<{ assessments: Assessment[] }>('/assessments');
  }
};
export default assessmentService;
