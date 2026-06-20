import { Schema, model, Document, Types } from 'mongoose';

export type ClientDecisionType =
  | 'ACCEPT'
  | 'REJECT_KEEP_ORIGINAL'
  | 'REJECT_RECOMMENDATION'
  | 'MODIFY_VERSION'
  | 'MODIFY_FINALIZE';

export interface IReviewDecision extends Document {
  requirementId: Types.ObjectId;
  decision: ClientDecisionType;
  comments?: string;
  modifiedVersion?: Types.ObjectId;
  createdAt: Date;
}

const ReviewDecisionSchema = new Schema<IReviewDecision>(
  {
    requirementId: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    decision: {
      type: String,
      enum: ['ACCEPT', 'REJECT_KEEP_ORIGINAL', 'REJECT_RECOMMENDATION', 'MODIFY_VERSION', 'MODIFY_FINALIZE'],
      required: true
    },
    comments: { type: String },
    modifiedVersion: { type: Schema.Types.ObjectId, ref: 'Requirement' }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const ReviewDecision = model<IReviewDecision>('ReviewDecision', ReviewDecisionSchema);
export default ReviewDecision;
