"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const Requirement_1 = require("../models/Requirement");
const RequirementChecklist_1 = require("../models/RequirementChecklist");
const ValidationResult_1 = require("../models/ValidationResult");
const Report_1 = require("../models/Report");
const RequirementChecklistService_1 = require("../services/RequirementChecklistService");
const ComparativeValidationService_1 = require("../services/ComparativeValidationService");
const ReportService_1 = require("../services/ReportService");
describe('REQWISE Comparative Validation Engine Deep Verification Tests', () => {
    let clientId;
    let qaId;
    let requirementId;
    let baselineSimilarity;
    beforeAll(async () => {
        delete process.env.GEMINI_API_KEY;
        process.env.NODE_ENV = 'test';
        await (0, db_1.connectDB)();
        // Clean up collections for this test run
        await User_1.User.deleteMany({});
        await Requirement_1.Requirement.deleteMany({});
        await RequirementChecklist_1.RequirementChecklist.deleteMany({});
        await ValidationResult_1.ValidationResult.deleteMany({});
        // Seed mock users
        const client = new User_1.User({ name: 'Test Client', email: 'client@test.com', password: 'password123', role: 'CLIENT' });
        await client.save();
        clientId = client._id.toString();
        const qa = new User_1.User({ name: 'Test QA', email: 'qa@test.com', password: 'password123', role: 'QA' });
        await qa.save();
        qaId = qa._id.toString();
    });
    afterAll(async () => {
        await mongoose_1.default.connection.close();
    });
    test('Step 1 & 2: Open requirement and verify checklist coverage is 0% when all items unchecked (Coverage != 100%)', async () => {
        // Seed historical finalized requirements in the same category to establish similarity baseline
        const hist = new Requirement_1.Requirement({
            title: 'E-commerce Payments Legacy',
            description: 'Legacy payment gateway module. Validates transaction validation constraints and implements PCI-DSS standards with secure authorization policies.',
            client: new mongoose_1.default.Types.ObjectId(clientId),
            category: 'E-commerce',
            project: 'LegacyCart',
            status: 'FINALIZED'
        });
        await hist.save();
        // Create a new requirement containing keywords: PCI-DSS, Concurrency, Validation, Transaction Logs, API Gateway, Authorization
        const req = new Requirement_1.Requirement({
            title: 'E-commerce ShopCart Payments',
            description: 'E-commerce payment gateway. Must validate transaction limits, include PCI-DSS standards, and support API Gateway integration. Concurrency locks must avoid race conditions. Authorization and Validation rules must be fully documented. Transaction Logs must be persisted.',
            client: new mongoose_1.default.Types.ObjectId(clientId),
            category: 'E-commerce',
            project: 'ShopCart',
            status: 'ASSIGNED',
            assignedQA: new mongoose_1.default.Types.ObjectId(qaId)
        });
        await req.save();
        requirementId = req._id.toString();
        // Seed a report for this requirement
        const report = new Report_1.Report({
            requirement: req._id,
            qa: new mongoose_1.default.Types.ObjectId(qaId),
            summary: 'Draft summary findings',
            missingFeatures: [],
            risks: [],
            status: 'DRAFT'
        });
        await report.save();
        // Initialize checklist
        const context = { title: req.title, description: req.description, category: req.category };
        const checklist = await RequirementChecklistService_1.RequirementChecklistService.initializeChecklist(req._id, context);
        // Verify all items are unchecked by default
        expect(checklist.items.length).toBeGreaterThan(0);
        const passCount = checklist.items.filter(item => item.result === 'Pass').length;
        const coverage = Math.round((passCount / checklist.items.length) * 100);
        expect(coverage).toBe(0); // Coverage is 0%, which is indeed !== 100%
    });
    test('Step 3: Edit requirement (remove PCI-DSS, Authorization and Concurrency) and verify Jaccard Similarity changes', async () => {
        // Run baseline validation to get the original Jaccard similarity score
        const valBaseline = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId);
        baselineSimilarity = valBaseline.similarity;
        // Verify validation result has isActive = true
        expect(valBaseline.isActive).toBe(true);
        // Verify report points to baseline validation result
        const reportAfter1 = await Report_1.Report.findOne({ requirement: requirementId });
        expect(reportAfter1?.validationResult?.toString()).toBe(valBaseline._id.toString());
        // Load and edit requirement to remove "PCI-DSS", "Authorization", and "Concurrency"
        const req = await Requirement_1.Requirement.findById(requirementId);
        expect(req).not.toBeNull();
        if (req) {
            req.description = 'E-commerce payment gateway. Must validate transaction limits and support API Gateway integration. Validation rules must be fully documented. Transaction Logs must be persisted.';
            await req.save();
        }
        // Run validation again on edited requirement
        const valResult = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId);
        // Expected: Jaccard similarity changes because the word set of the description was updated
        expect(valResult.similarity).not.toBe(baselineSimilarity);
        // Verify history is preserved: both ValidationResults exist in DB
        const allResults = await ValidationResult_1.ValidationResult.find({ requirement: requirementId }).sort({ createdAt: 1 });
        expect(allResults.length).toBe(2);
        // Verify previous ValidationResult becomes isActive = false
        expect(allResults[0]._id.toString()).toBe(valBaseline._id.toString());
        expect(allResults[0].isActive).toBe(false);
        // Verify new ValidationResult has isActive = true
        expect(allResults[1]._id.toString()).toBe(valResult._id.toString());
        expect(allResults[1].isActive).toBe(true);
        // Verify report points to latest ValidationResult
        const reportAfter2 = await Report_1.Report.findOne({ requirement: requirementId });
        expect(reportAfter2?.validationResult?.toString()).toBe(valResult._id.toString());
    });
    test('Step 4: Create Requirement v2 (change business rules) and verify Version Changes > 0', async () => {
        // Create version 2 of the requirement, modifying the business rules
        const reqV1 = await Requirement_1.Requirement.findById(requirementId);
        expect(reqV1).not.toBeNull();
        if (!reqV1)
            return;
        const reqV2 = new Requirement_1.Requirement({
            title: reqV1.title,
            description: reqV1.description + '\nAdd new business rule: all refunds must be approved by manager within 24 hours.',
            client: reqV1.client,
            assignedQA: reqV1.assignedQA,
            category: reqV1.category,
            project: reqV1.project,
            version: 2,
            originalRequirementId: reqV1.originalRequirementId || reqV1._id,
            parentVersionId: reqV1._id,
            status: 'ASSIGNED'
        });
        await reqV2.save();
        // Run validation on v2
        const valV2 = await ComparativeValidationService_1.ComparativeValidationService.runValidation(reqV2._id);
        // Expected: Version changes contains elements because description was changed compared to parent v1
        expect(valV2.versionChanges.length).toBeGreaterThan(0);
    });
    test('Step 5: Add contradiction (Latency <100ms AND batch process every 10 mins) and verify Conflict Alerts > 0', async () => {
        const req = await Requirement_1.Requirement.findById(requirementId);
        expect(req).not.toBeNull();
        if (!req)
            return;
        // Inject contradictory requirements: low latency expectations vs batch processing
        req.description = 'System must guarantee response latency <100ms. Transactions will be processed in a batch process every 10 mins.';
        await req.save();
        // Run validation
        const valResult = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId);
        // Expected: Conflict Alerts is triggered
        expect(valResult.conflictAlerts.length).toBeGreaterThan(0);
        expect(valResult.conflictAlerts[0]).toContain('Low latency expectations contradict batch processing');
    });
    test('Step 6: Refresh/Reload and verify values persist in database', async () => {
        // Query validation result from database to verify persistence
        const savedResult = await ValidationResult_1.ValidationResult.findOne({ requirement: requirementId }).sort({ createdAt: -1 });
        expect(savedResult).not.toBeNull();
        if (savedResult) {
            expect(savedResult.conflictAlerts.length).toBeGreaterThan(0);
            expect(savedResult.conflictAlerts[0]).toContain('Low latency expectations contradict batch processing');
        }
    });
    test('Step 7: Final Validation Integrity Scenario (5 validation runs on same requirement)', async () => {
        // 1. Run validation 5 times on the same requirement
        const validationResults = [];
        for (let i = 0; i < 5; i++) {
            const result = await ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId);
            validationResults.push(result);
        }
        // 2. Verify: count({ requirement, isActive: true }) == 1
        const activeCount = await ValidationResult_1.ValidationResult.countDocuments({
            requirement: requirementId,
            isActive: true
        });
        expect(activeCount).toBe(1);
        // 3. Verify: report points to latest ValidationResult ID
        const latestValResult = validationResults[4];
        const report = await Report_1.Report.findOne({ requirement: requirementId });
        expect(report).not.toBeNull();
        expect(report?.validationResult?.toString()).toBe(latestValResult._id.toString());
        // 4. Verify: older records have isActive = false
        const olderCount = await ValidationResult_1.ValidationResult.countDocuments({
            requirement: requirementId,
            isActive: false
        });
        // Older validations plus the 4 from this test run
        expect(olderCount).toBeGreaterThanOrEqual(4);
        for (let i = 0; i < 4; i++) {
            const savedRes = await ValidationResult_1.ValidationResult.findById(validationResults[i]._id);
            expect(savedRes?.isActive).toBe(false);
        }
        // 5. Verify: fetchReport() returns the latest active validation result
        const reportWithPopulatedVal = await ReportService_1.ReportService.getReportByRequirement(requirementId);
        expect(reportWithPopulatedVal).not.toBeNull();
        const populatedValResult = reportWithPopulatedVal?.validationResult;
        expect(populatedValResult).toBeDefined();
        expect(populatedValResult?._id.toString()).toBe(latestValResult._id.toString());
        expect(populatedValResult?.isActive).toBe(true);
        // Fail if:
        // - Multiple active rows exist
        const allActiveRows = await ValidationResult_1.ValidationResult.find({ requirement: requirementId, isActive: true });
        if (allActiveRows.length > 1) {
            throw new Error('Failure: multiple active rows exist');
        }
        // - Report points to inactive validation
        const currentReport = await Report_1.Report.findOne({ requirement: requirementId }).populate('validationResult');
        const linkedValResult = currentReport?.validationResult;
        if (linkedValResult && !linkedValResult.isActive) {
            throw new Error('Failure: report points to inactive validation');
        }
        // - Latest validation not returned
        const newestValResult = await ValidationResult_1.ValidationResult.findOne({ requirement: requirementId }).sort({ createdAt: -1 });
        if (linkedValResult?._id.toString() !== newestValResult?._id.toString()) {
            throw new Error('Failure: latest validation not returned');
        }
    });
    test('Step 8: Simulate parallel validation runs and verify database uniqueness safeguard', async () => {
        // Sync Mongoose schema indexes with MongoDB to ensure index is created
        await ValidationResult_1.ValidationResult.syncIndexes();
        // Run 3 validations in parallel and verify that all succeed without throwing errors
        const results = await Promise.all([
            ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId),
            ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId),
            ComparativeValidationService_1.ComparativeValidationService.runValidation(requirementId)
        ]);
        expect(results[0]).toBeDefined();
        expect(results[1]).toBeDefined();
        expect(results[2]).toBeDefined();
        const id1 = results[0]._id.toString();
        const id2 = results[1]._id.toString();
        const id3 = results[2]._id.toString();
        // Assert all parallel runs returned the exact same active validation ID
        expect(id1).toBe(id2);
        expect(id2).toBe(id3);
        // Verify DB integrity:
        // 1. Maximum of 1 active ValidationResult per requirement
        const activeCount = await ValidationResult_1.ValidationResult.countDocuments({
            requirement: requirementId,
            isActive: true
        });
        expect(activeCount).toBe(1);
        // 2. Report points to the latest active validation result
        const activeResult = await ValidationResult_1.ValidationResult.findOne({
            requirement: requirementId,
            isActive: true
        });
        expect(activeResult).not.toBeNull();
        expect(activeResult?._id.toString()).toBe(id1);
        const report = await Report_1.Report.findOne({ requirement: requirementId });
        expect(report).not.toBeNull();
        expect(report?.validationResult?.toString()).toBe(id1);
    });
});
