import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';

export class AuditService {
  static async log(
    actorId: string | Types.ObjectId,
    action: string,
    entity: string,
    entityId: string | Types.ObjectId,
    before?: any,
    after?: any
  ): Promise<void> {
    try {
      await AuditLog.create({
        actor: actorId,
        action,
        entity,
        entityId,
        before,
        after
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}
export default AuditService;
