import { Schema, model, Document, Types } from 'mongoose';

export type SeverityType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IMistake extends Document {
  qa: Types.ObjectId;
  requirement: Types.ObjectId;
  project: string;
  category: string;
  mistakeType: string;
  severity: SeverityType;
  createdAt: Date;
}

const MistakeSchema = new Schema<IMistake>(
  {
    qa: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requirement: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true },
    project: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    mistakeType: { type: String, required: true, index: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Mistake = model<IMistake>('Mistake', MistakeSchema);
export default Mistake;
