"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementChecklist = void 0;
const mongoose_1 = require("mongoose");
const RequirementChecklistSchema = new mongoose_1.Schema({
    requirement: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    checklistVersion: { type: Number, default: 1 },
    items: [
        {
            text: { type: String, required: true },
            result: { type: String, enum: ['Pass', 'Fail', 'N/S'], default: 'N/S' },
            section: { type: String },
            category: { type: String }
        }
    ]
}, {
    timestamps: true
});
exports.RequirementChecklist = (0, mongoose_1.model)('RequirementChecklist', RequirementChecklistSchema);
exports.default = exports.RequirementChecklist;
