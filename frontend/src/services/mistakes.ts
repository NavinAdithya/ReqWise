import { request } from './api';
import type { Mistake } from '../types';

export const mistakeService = {
  logMistake: async (data: {
    qaId: string;
    requirementId: string;
    mistakeType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
  }) => {
    return request<{ mistake: Mistake; triggeredAssessment: any }>('/mistakes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMistakesByQA: async (qaId: string) => {
    return request<{ mistakes: Mistake[] }>(`/mistakes/qa/${qaId}`);
  },

  getAllMistakes: async () => {
    return request<{ mistakes: Mistake[] }>('/mistakes');
  }
};
export default mistakeService;
