"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const AuditLog_1 = require("../models/AuditLog");
class AuditService {
    static async log(actorId, action, entity, entityId, before, after) {
        try {
            await AuditLog_1.AuditLog.create({
                actor: actorId,
                action,
                entity,
                entityId,
                before,
                after
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
