"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requirement = void 0;
const mongoose_1 = require("mongoose");
const RequirementSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    client: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedQA: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true, index: true },
    project: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: [
            'DRAFT',
            'ASSIGNED',
            'UNDER_ANALYSIS',
            'REPORT_GENERATED',
            'UNDER_REVIEW',
            'CLIENT_REVIEW',
            'REVALIDATION',
            'FINALIZED',
            'CANCELED'
        ],
        default: 'DRAFT',
        required: true
    },
    version: { type: Number, default: 1, required: true },
    originalRequirementId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement' },
    parentVersionId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement' }
}, {
    timestamps: true
});
exports.Requirement = (0, mongoose_1.model)('Requirement', RequirementSchema);
exports.default = exports.Requirement;
