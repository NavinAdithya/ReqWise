"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistakeController = void 0;
const MistakeService_1 = require("../services/MistakeService");
const Mistake_1 = require("../models/Mistake");
const validation_1 = require("../utils/validation");
class MistakeController {
    static async create(req, res) {
        try {
            const parsed = validation_1.logMistakeSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ message: 'Validation failed', errors: parsed.error.errors });
            }
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await MistakeService_1.MistakeService.logMistake(req.user.id, parsed.data);
            return res.status(201).json(result);
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async listByQA(req, res) {
        try {
            const qaId = req.params.qaId;
            const mistakes = await Mistake_1.Mistake.find({ qa: qaId }).sort({ createdAt: -1 });
            return res.status(200).json({ mistakes });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
    static async listAll(req, res) {
        try {
            const mistakes = await Mistake_1.Mistake.find().populate('qa').populate('requirement').sort({ createdAt: -1 });
            return res.status(200).json({ mistakes });
        }
        catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.MistakeController = MistakeController;
exports.default = MistakeController;
