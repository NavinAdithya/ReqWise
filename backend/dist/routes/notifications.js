"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const NotificationService_1 = require("../services/NotificationService");
const router = (0, express_1.Router)();
router.get('/', auth_1.protect, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const notifications = await NotificationService_1.NotificationService.getNotificationsForUser(req.user.id);
        return res.status(200).json({ notifications });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
router.patch('/:id/read', auth_1.protect, async (req, res) => {
    try {
        const notification = await NotificationService_1.NotificationService.markAsRead(req.params.id);
        return res.status(200).json({ notification });
    }
    catch (error) {
        return res.status(400).json({ message: error.message });
    }
});
exports.default = router;
