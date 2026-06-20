import { Schema, model, Document, Types } from 'mongoose';

export interface IValidationResult extends Document {
  requirement: Types.ObjectId;
  checklistCoverage: number;
  similarity: number | null;
  missingSections: string[];
  versionChanges: string[];
  conflictAlerts: string[];
  isActive: boolean;
  createdAt: Date;
}

const ValidationResultSchema = new Schema<IValidationResult>(
  {
    requirement: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    checklistCoverage: { type: Number, required: true },
    similarity: { type: Number },
    missingSections: [{ type: String }],
    versionChanges: [{ type: String }],
    conflictAlerts: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }
);

ValidationResultSchema.index(
  { requirement: 1, isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

export const ValidationResult = model<IValidationResult>('ValidationResult', ValidationResultSchema);
export default ValidationResult;
