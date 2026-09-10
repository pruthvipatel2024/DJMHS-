import api from './api';

export interface InAppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  channel: 'IN_APP' | 'SMS' | 'EMAIL';
  isRead: boolean;
  sentAt: string;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: InAppNotification[];
  unreadCount: number;
}

export const NotificationService = {
  getNotifications: async (): Promise<{ notifications: InAppNotification[]; unreadCount: number }> => {
    try {
      const res = await api.get<NotificationResponse>('/notifications');
      return {
        notifications: res.data?.data || [],
        unreadCount: res.data?.unreadCount || 0,
      };
    } catch (err) {
      return { notifications: [], unreadCount: 0 };
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await api.patch(`/notifications/${id}/read`);
      return res.data?.success || false;
    } catch (err) {
      return false;
    }
  },

  markAllAsRead: async (): Promise<boolean> => {
    try {
      const res = await api.patch('/notifications/mark-all-read');
      return res.data?.success || false;
    } catch (err) {
      return false;
    }
  },

  deleteNotification: async (id: string): Promise<boolean> => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      return res.data?.success || false;
    } catch (err) {
      return false;
    }
  },

  broadcastNotification: async (payload: { title: string; message: string; targetRole?: string; recipientId?: string }): Promise<boolean> => {
    try {
      const res = await api.post('/notifications/broadcast', payload);
      return res.data?.success || false;
    } catch (err) {
      return false;
    }
  },
};

export default NotificationService;
