import { Types } from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';

export class NotificationService {
  static async notify(
    userId: string | Types.ObjectId,
    type: NotificationType,
    message: string
  ): Promise<void> {
    try {
      await Notification.create({
        user: userId,
        type,
        message
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  static async getNotificationsForUser(userId: string | Types.ObjectId) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
  }

  static async markAsRead(notificationId: string | Types.ObjectId) {
    return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
  }
}
export default NotificationService;
