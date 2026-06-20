"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = void 0;
const mongoose_1 = require("mongoose");
const ValidationResultSchema = new mongoose_1.Schema({
    requirement: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    checklistCoverage: { type: Number, required: true },
    similarity: { type: Number },
    missingSections: [{ type: String }],
    versionChanges: [{ type: String }],
    conflictAlerts: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});
ValidationResultSchema.index({ requirement: 1, isActive: 1 }, {
    unique: true,
    partialFilterExpression: { isActive: true }
});
exports.ValidationResult = (0, mongoose_1.model)('ValidationResult', ValidationResultSchema);
exports.default = exports.ValidationResult;
