import { Schema, model, Document, Types } from 'mongoose';

export type NotificationType = 'ASSIGNMENT' | 'REVIEW' | 'CLIENT_DECISION' | 'ASSESSMENT';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ASSIGNMENT', 'REVIEW', 'CLIENT_DECISION', 'ASSESSMENT'],
      required: true
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
export default Notification;
