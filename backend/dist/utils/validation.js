"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAssessmentSchema = exports.logMistakeSchema = exports.clientDecisionSchema = exports.reviewReportSchema = exports.draftReportSchema = exports.assignSchema = exports.requirementSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    role: zod_1.z.enum(['ADMIN', 'QA', 'CLIENT'])
});
exports.requirementSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    category: zod_1.z.string().min(2),
    project: zod_1.z.string().min(2)
});
exports.assignSchema = zod_1.z.object({
    assignedQAId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId')
});
exports.draftReportSchema = zod_1.z.object({
    requirementId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    summary: zod_1.z.string().min(5),
    missingFeatures: zod_1.z.array(zod_1.z.string()),
    risks: zod_1.z.array(zod_1.z.string()),
    comments: zod_1.z.string().optional()
});
exports.reviewReportSchema = zod_1.z.object({
    reportId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    action: zod_1.z.enum(['APPROVE', 'REJECT', 'SEND_TO_CLIENT']),
    feedback: zod_1.z.string().optional()
});
exports.clientDecisionSchema = zod_1.z.object({
    requirementId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    decision: zod_1.z.enum(['ACCEPT', 'REJECT_KEEP_ORIGINAL', 'REJECT_RECOMMENDATION', 'MODIFY_VERSION', 'MODIFY_FINALIZE']),
    comments: zod_1.z.string().optional(),
    modifiedTitle: zod_1.z.string().optional(),
    modifiedDescription: zod_1.z.string().optional()
});
exports.logMistakeSchema = zod_1.z.object({
    qaId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    requirementId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    mistakeType: zod_1.z.string().min(2),
    severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH'])
});
exports.submitAssessmentSchema = zod_1.z.object({
    assessmentId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
    answers: zod_1.z.array(zod_1.z.string().min(1, 'Answers cannot be empty'))
});
