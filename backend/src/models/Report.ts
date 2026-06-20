import { Schema, model, Document, Types } from 'mongoose';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'APPROVED_INTERNAL' | 'SENT_TO_CLIENT' | 'REJECTED';

export interface IReport extends Document {
  requirement: Types.ObjectId;
  qa: Types.ObjectId;
  summary: string;
  missingFeatures: string[];
  risks: string[];
  comments?: string;
  validationResult?: Types.ObjectId;
  status: ReportStatus;
  adminFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    requirement: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    qa: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    summary: { type: String, required: true },
    missingFeatures: [{ type: String }],
    risks: [{ type: String }],
    comments: { type: String },
    validationResult: { type: Schema.Types.ObjectId, ref: 'ValidationResult' },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'APPROVED_INTERNAL', 'SENT_TO_CLIENT', 'REJECTED'],
      default: 'DRAFT',
      required: true
    },
    adminFeedback: { type: String }
  },
  {
    timestamps: true
  }
);

export const Report = model<IReport>('Report', ReportSchema);
export default Report;
