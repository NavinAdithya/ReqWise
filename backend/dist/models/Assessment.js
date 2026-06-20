"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assessment = void 0;
const mongoose_1 = require("mongoose");
const AssessmentSchema = new mongoose_1.Schema({
    qa: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggeredMistakes: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Mistake', required: true }],
    totalWeight: { type: Number, required: true },
    questions: [{ type: String }],
    answers: [{ type: String }],
    score: { type: Number, default: 0, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED'],
        default: 'PENDING',
        required: true
    },
    deadline: { type: Date, required: true },
    penaltyCharge: { type: Number, default: 0 },
    completedAt: { type: Date }
}, {
    timestamps: true
});
exports.Assessment = (0, mongoose_1.model)('Assessment', AssessmentSchema);
exports.default = exports.Assessment;
