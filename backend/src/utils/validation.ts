import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'QA', 'CLIENT'])
});

export const requirementSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  project: z.string().min(2)
});

export const assignSchema = z.object({
  assignedQAId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId')
});

export const draftReportSchema = z.object({
  requirementId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  summary: z.string().min(5),
  missingFeatures: z.array(z.string()),
  risks: z.array(z.string()),
  comments: z.string().optional()
});

export const reviewReportSchema = z.object({
  reportId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  action: z.enum(['APPROVE', 'REJECT', 'SEND_TO_CLIENT']),
  feedback: z.string().optional()
});

export const clientDecisionSchema = z.object({
  requirementId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  decision: z.enum(['ACCEPT', 'REJECT_KEEP_ORIGINAL', 'REJECT_RECOMMENDATION', 'MODIFY_VERSION', 'MODIFY_FINALIZE']),
  comments: z.string().optional(),
  modifiedTitle: z.string().optional(),
  modifiedDescription: z.string().optional()
});

export const logMistakeSchema = z.object({
  qaId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  requirementId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  mistakeType: z.string().min(2),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH'])
});

export const submitAssessmentSchema = z.object({
  assessmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId'),
  answers: z.array(z.string().min(1, 'Answers cannot be empty'))
});
