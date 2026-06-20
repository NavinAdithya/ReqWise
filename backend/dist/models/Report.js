"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const ReportSchema = new mongoose_1.Schema({
    requirement: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    qa: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: { type: String, required: true },
    missingFeatures: [{ type: String }],
    risks: [{ type: String }],
    comments: { type: String },
    validationResult: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ValidationResult' },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'REJECTED'],
        default: 'DRAFT',
        required: true
    },
    adminFeedback: { type: String }
}, {
    timestamps: true
});
exports.Report = (0, mongoose_1.model)('Report', ReportSchema);
exports.default = exports.Report;
