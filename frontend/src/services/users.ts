import { request } from './api';

export const userService = {
  getQAPerformance: async (): Promise<{ data: any[] }> => {
    return request<{ data: any[] }>('/users/qa-performance');
  }
};
export default userService;
