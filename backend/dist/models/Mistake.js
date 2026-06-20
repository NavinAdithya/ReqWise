"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mistake = void 0;
const mongoose_1 = require("mongoose");
const MistakeSchema = new mongoose_1.Schema({
    qa: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requirement: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement', required: true },
    project: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    mistakeType: { type: String, required: true, index: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.Mistake = (0, mongoose_1.model)('Mistake', MistakeSchema);
exports.default = exports.Mistake;
