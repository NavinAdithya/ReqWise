import { request } from './api';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<{ notifications: Notification[] }> => {
    return request<{ notifications: Notification[] }>('/notifications');
  },

  markAsRead: async (id: string): Promise<{ notification: Notification }> => {
    return request<{ notification: Notification }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    });
  }
};
export default notificationService;
