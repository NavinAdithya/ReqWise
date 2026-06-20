"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentRequest = void 0;
const mongoose_1 = require("mongoose");
const AssessmentRequestSchema = new mongoose_1.Schema({
    qa: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['OPEN', 'EVALUATED', 'EXECUTED', 'CANCELLED'],
        default: 'OPEN',
        required: true
    }
}, {
    timestamps: true
});
exports.AssessmentRequest = (0, mongoose_1.model)('AssessmentRequest', AssessmentRequestSchema);
exports.default = exports.AssessmentRequest;
