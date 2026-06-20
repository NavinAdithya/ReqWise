"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewDecision = void 0;
const mongoose_1 = require("mongoose");
const ReviewDecisionSchema = new mongoose_1.Schema({
    requirementId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    decision: {
        type: String,
        enum: ['ACCEPT', 'REJECT_KEEP_ORIGINAL', 'REJECT_RECOMMENDATION', 'MODIFY_VERSION', 'MODIFY_FINALIZE'],
        required: true
    },
    comments: { type: String },
    modifiedVersion: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement' }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
exports.ReviewDecision = (0, mongoose_1.model)('ReviewDecision', ReviewDecisionSchema);
exports.default = exports.ReviewDecision;
