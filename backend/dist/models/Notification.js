"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const NotificationSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['ASSIGNMENT', 'REVIEW', 'CLIENT_DECISION', 'ASSESSMENT'],
        required: true
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.Notification = (0, mongoose_1.model)('Notification', NotificationSchema);
exports.default = exports.Notification;
