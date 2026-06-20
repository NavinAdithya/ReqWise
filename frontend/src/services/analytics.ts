import { request } from './api';

export interface AnalyticsResponse {
  requirementsByStatus: { status: string; count: number }[];
  mistakesByCategory: { category: string; count: number }[];
  mistakesByType: { mistakeType: string; count: number }[];
  qaAssessments: {
    qaName: string;
    score: number;
    status: string;
    totalWeight: number;
    completedAt?: string;
  }[];
}

export const analyticsService = {
  getDashboardData: async (): Promise<AnalyticsResponse> => {
    return request<AnalyticsResponse>('/analytics');
  }
};
export default analyticsService;
