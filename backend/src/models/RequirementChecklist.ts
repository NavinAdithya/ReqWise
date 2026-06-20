import { Schema, model, Document, Types } from 'mongoose';

export interface IChecklistItem {
  text: string;
  result: 'Pass' | 'Fail' | 'N/S';
  section?: string;
  category?: string;
}

export interface IRequirementChecklist extends Document {
  requirement: Types.ObjectId;
  items: IChecklistItem[];
  checklistVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const RequirementChecklistSchema = new Schema<IRequirementChecklist>(
  {
    requirement: { type: Schema.Types.ObjectId, ref: 'Requirement', required: true, index: true },
    checklistVersion: { type: Number, default: 1 },
    items: [
      {
        text: { type: String, required: true },
        result: { type: String, enum: ['Pass', 'Fail', 'N/S'], default: 'N/S' },
        section: { type: String },
        category: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const RequirementChecklist = model<IRequirementChecklist>('RequirementChecklist', RequirementChecklistSchema);
export default RequirementChecklist;
