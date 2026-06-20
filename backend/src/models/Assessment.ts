import { Schema, model, Document, Types } from 'mongoose';

export type AssessmentStatus = 'PENDING' | 'COMPLETED';

export interface IAssessment extends Document {
  qa: Types.ObjectId;
  triggeredMistakes: Types.ObjectId[];
  totalWeight: number;
  questions: string[];
  answers: string[];
  score: number;
  status: AssessmentStatus;
  deadline: Date;
  penaltyCharge: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    qa: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    triggeredMistakes: [{ type: Schema.Types.ObjectId, ref: 'Mistake', required: true }],
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
  },
  {
    timestamps: true
  }
);

export const Assessment = model<IAssessment>('Assessment', AssessmentSchema);
export default Assessment;
