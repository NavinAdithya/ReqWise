"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    actor: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    before: { type: mongoose_1.Schema.Types.Mixed },
    after: { type: mongoose_1.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, required: true }
});
exports.AuditLog = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
exports.default = exports.AuditLog;
