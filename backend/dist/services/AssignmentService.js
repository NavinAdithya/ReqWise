"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentService = void 0;
const mongoose_1 = require("mongoose");
const Requirement_1 = require("../models/Requirement");
const User_1 = require("../models/User");
const NotificationService_1 = require("./NotificationService");
const AuditService_1 = require("./AuditService");
class AssignmentService {
    static async assignQA(adminId, requirementId, qaId) {
        const requirement = await Requirement_1.Requirement.findById(requirementId);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        if (requirement.status !== 'DRAFT') {
            throw new Error('Can only assign QA to requirements in DRAFT status');
        }
        const qaUser = await User_1.User.findById(qaId);
        if (!qaUser || qaUser.role !== 'QA') {
            throw new Error('Invalid user or user is not a QA member');
        }
        const oldQA = requirement.assignedQA;
        requirement.assignedQA = new mongoose_1.Types.ObjectId(qaId.toString());
        requirement.status = 'ASSIGNED';
        await requirement.save();
        // Audit Log
        await AuditService_1.AuditService.log(adminId, 'ASSIGN_QA', 'Requirement', requirement._id, { assignedQA: oldQA, status: 'DRAFT' }, { assignedQA: qaId, status: 'ASSIGNED' });
        // Notify the QA
        await NotificationService_1.NotificationService.notify(qaId, 'ASSIGNMENT', `You have been assigned to analyze the requirement: "${requirement.title}"`);
        return requirement;
    }
}
exports.AssignmentService = AssignmentService;
exports.default = AssignmentService;
