import { Schema, model, Document, Types } from 'mongoose';

export type RequirementStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'UNDER_ANALYSIS'
  | 'REPORT_GENERATED'
  | 'UNDER_REVIEW'
  | 'CLIENT_REVIEW'
  | 'REVALIDATION'
  | 'FINALIZED'
  | 'CANCELED';

export interface IRequirement extends Document {
  title: string;
  description: string;
  client: Types.ObjectId;
  assignedQA?: Types.ObjectId;
  category: string;
  project: string;
  status: RequirementStatus;
  version: number;
  originalRequirementId?: Types.ObjectId;
  parentVersionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<IRequirement>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedQA: { type: Schema.Types.ObjectId, ref: 'User' },
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
    originalRequirementId: { type: Schema.Types.ObjectId, ref: 'Requirement' },
    parentVersionId: { type: Schema.Types.ObjectId, ref: 'Requirement' }
  },
  {
    timestamps: true
  }
);

export const Requirement = model<IRequirement>('Requirement', RequirementSchema);
export default Requirement;
