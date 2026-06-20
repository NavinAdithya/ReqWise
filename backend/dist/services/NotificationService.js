"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
class NotificationService {
    static async notify(userId, type, message) {
        try {
            await Notification_1.Notification.create({
                user: userId,
                type,
                message
            });
        }
        catch (error) {
            console.error('Failed to create notification:', error);
        }
    }
    static async getNotificationsForUser(userId) {
        return Notification_1.Notification.find({ user: userId }).sort({ createdAt: -1 });
    }
    static async markAsRead(notificationId) {
        return Notification_1.Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
