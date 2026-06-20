"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Requirement_1 = require("../models/Requirement");
const RequirementChecklist_1 = require("../models/RequirementChecklist");
const ValidationResult_1 = require("../models/ValidationResult");
const Report_1 = require("../models/Report");
const Mistake_1 = require("../models/Mistake");
const Assessment_1 = require("../models/Assessment");
const RequirementChecklistService_1 = require("../services/RequirementChecklistService");
const CATEGORIES = ['Fintech', 'Healthcare', 'E-commerce', 'Web Development'];
const PROJECTS = ['Fintech Ledger', 'Healthcare MedRecord', 'E-commerce ShopCart', 'Web Dev CoreInfo'];
async function seed() {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reqwise';
    console.log(`Connecting to database at ${connUri}...`);
    await mongoose_1.default.connect(connUri);
    console.log('Connected. Clearing database first...');
    // Clear existing data (do NOT wipe all checklists, requirements or users)
    await ValidationResult_1.ValidationResult.deleteMany({});
    await Report_1.Report.deleteMany({});
    await Mistake_1.Mistake.deleteMany({});
    await Assessment_1.Assessment.deleteMany({});
    console.log('Database cleared of results, mistakes and assessments. Seeding users...');
    // 1. Seed 3 Admins
    const adminNames = ['Navin', 'Admin User 2', 'Admin User 3'];
    const admins = [];
    for (let i = 0; i < 3; i++) {
        let admin = await User_1.User.findOne({ email: `admin${i + 1}@reqwise.com` });
        if (!admin) {
            admin = new User_1.User({
                name: adminNames[i],
                email: `admin${i + 1}@reqwise.com`,
                password: 'password123',
                role: 'ADMIN'
            });
            await admin.save();
        }
        admins.push(admin);
    }
    console.log(`Seeded/verified ${admins.length} Admins.`);
    // 2. Seed 10 QAs
    const qaNames = ['Sandhya', 'Nivetha', 'Monish', 'Aishwarya', 'Akshaya', 'Allen', 'QA Analyst 7', 'QA Analyst 8', 'QA Analyst 9', 'QA Analyst 10'];
    const qas = [];
    for (let i = 0; i < 10; i++) {
        let qa = await User_1.User.findOne({ email: `qa${i + 1}@reqwise.com` });
        if (!qa) {
            qa = new User_1.User({
                name: qaNames[i],
                email: `qa${i + 1}@reqwise.com`,
                password: 'password123',
                role: 'QA'
            });
            await qa.save();
        }
        qas.push(qa);
    }
    console.log(`Seeded/verified ${qas.length} QAs.`);
    // 3. Seed 20 Clients
    const clients = [];
    for (let i = 1; i <= 20; i++) {
        let client = await User_1.User.findOne({ email: `client${i}@reqwise.com` });
        if (!client) {
            client = new User_1.User({
                name: `Client Sponsor ${i}`,
                email: `client${i}@reqwise.com`,
                password: 'password123',
                role: 'CLIENT'
            });
            await client.save();
        }
        clients.push(client);
    }
    console.log(`Seeded/verified ${clients.length} Clients.`);
    // 4. Seed 100 Requirements
    console.log('Seeding/verifying 100 Requirements and Checklists...');
    const requirements = [];
    for (let i = 1; i <= 100; i++) {
        const category = CATEGORIES[i % CATEGORIES.length];
        const project = PROJECTS[i % PROJECTS.length];
        const client = clients[i % clients.length];
        // Distribute status realistically
        let status = 'DRAFT';
        if (i <= 40)
            status = 'FINALIZED';
        else if (i <= 65)
            status = 'CLIENT_REVIEW';
        else if (i <= 80)
            status = 'UNDER_REVIEW';
        else if (i <= 90)
            status = 'UNDER_ANALYSIS';
        else if (i <= 95)
            status = 'ASSIGNED';
        else
            status = 'DRAFT';
        const qa = status !== 'DRAFT' ? qas[i % qas.length] : undefined;
        let req = await Requirement_1.Requirement.findOne({ title: `${category} Specification Doc #${i}` });
        if (!req) {
            req = new Requirement_1.Requirement({
                title: `${category} Specification Doc #${i}`,
                description: `Detailed software requirement specifications for ${category} modules in ${project}.\n` +
                    `Required compliance checks: must include PCI-DSS standards, transaction logs, API gateways, and authorization policies.\n` +
                    `Must verify SSL, handle SQL validation inputs, and lock resource concurrency limits to avoid race conditions.\n` +
                    `Internal Reference ID: ${Math.random().toString(36).substring(7).toUpperCase()}`,
                client: client._id,
                assignedQA: qa ? qa._id : undefined,
                category,
                project,
                status,
                version: 1
            });
            await req.save();
        }
        requirements.push(req);
        // Create/regenerate checklist
        let checklist = await RequirementChecklist_1.RequirementChecklist.findOne({ requirement: req._id });
        if (!checklist) {
            const context = {
                title: req.title,
                description: req.description,
                category: req.category
            };
            checklist = await RequirementChecklistService_1.RequirementChecklistService.initializeChecklist(req._id, context);
            if (['REPORT_GENERATED', 'UNDER_REVIEW', 'CLIENT_REVIEW', 'FINALIZED'].includes(status)) {
                checklist.items.forEach((item, idx) => {
                    // Leave some unchecked
                    item.result = (idx % 3 !== 0) ? 'Pass' : 'Fail';
                });
                await checklist.save();
            }
        }
        else if (checklist.checklistVersion !== 2) {
            const context = {
                title: req.title,
                description: req.description,
                category: req.category
            };
            checklist.items = RequirementChecklistService_1.RequirementChecklistService.generateChecklist(context);
            checklist.checklistVersion = 2;
            if (['REPORT_GENERATED', 'UNDER_REVIEW', 'CLIENT_REVIEW', 'FINALIZED'].includes(status)) {
                checklist.items.forEach((item, idx) => {
                    item.result = (idx % 3 !== 0) ? 'Pass' : 'Fail';
                });
            }
            await checklist.save();
        }
    }
    console.log(`Seeded/verified ${requirements.length} Requirements & checklists.`);
    // 5. Seed Reports & validation results for active statuses
    console.log('Seeding Reports and Validation Results...');
    const activeReportRequirements = requirements.filter(r => ['REPORT_GENERATED', 'UNDER_REVIEW', 'CLIENT_REVIEW', 'FINALIZED'].includes(r.status));
    let reportCount = 0;
    for (const req of activeReportRequirements) {
        const qa = req.assignedQA || qas[0]._id;
        // Find checklist to calculate actual coverage percentage
        const checklist = await RequirementChecklist_1.RequirementChecklist.findOne({ requirement: req._id });
        const totalItems = checklist?.items?.length || 0;
        const checkedItems = checklist?.items?.filter((item) => item.checked).length || 0;
        const coverage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
        // Create a validation result
        const valRes = new ValidationResult_1.ValidationResult({
            requirement: req._id,
            checklistCoverage: coverage,
            similarity: 70 + (reportCount % 20), // 70% to 90% Jaccard
            missingSections: req.category === 'Fintech' ? ['Missing Transaction lock header'] : [],
            versionChanges: [],
            conflictAlerts: req.category === 'Fintech' ? ['Potential HTTP instead of HTTPS conflict'] : []
        });
        await valRes.save();
        const report = new Report_1.Report({
            requirement: req._id,
            qa: qa,
            summary: `Manual validation analysis report summary for requirement doc ${req.title}.\n` +
                `All checklist validation items verified. Confirmed pci-compliance and security constraints.`,
            missingFeatures: ['Transaction throttling validation', 'Secondary DB fallback configuration'],
            risks: ['Race condition risk on payment hook processing concurrency'],
            validationResult: valRes._id,
            status: req.status === 'FINALIZED' ? 'APPROVED' :
                req.status === 'CLIENT_REVIEW' ? 'APPROVED' :
                    req.status === 'UNDER_REVIEW' ? 'SUBMITTED' : 'DRAFT',
            comments: 'Human findings verified against system rules.'
        });
        await report.save();
        reportCount++;
    }
    console.log(`Seeded ${reportCount} QA Reports and validation results.`);
    // 6. Seed 30 Mistakes
    console.log('Seeding 30 Mistakes to trigger assessments...');
    // We want to seed mistakes specifically for certain QAs to exceed the threshold (>= 10 points)
    // Let's seed 12 points of mistakes for QA 1 (4 mistakes * 3 points = 12, category Fintech)
    // Let's seed 10 points of mistakes for QA 2 (2 mistakes * 5 points = 10, same project)
    // Let's distribute the remaining 14 mistakes across other QAs.
    const mistakeTypes = [
        'Ambiguous Flow',
        'Boundary Edge Case Missing',
        'Checklist Accuracy Fail',
        'Insecure Implementation Detail'
    ];
    const severities = ['LOW', 'MEDIUM', 'HIGH'];
    let mistakeCount = 0;
    // QA 1 Category-based Trigger (Fintech)
    const qa1 = qas[0];
    const fintechReqs = requirements.filter(r => r.category === 'Fintech');
    for (let i = 0; i < 4; i++) {
        const mistake = new Mistake_1.Mistake({
            qa: qa1._id,
            requirement: fintechReqs[i % fintechReqs.length]._id,
            project: `Project ${i + 1}`,
            category: 'Fintech',
            mistakeType: 'Boundary Edge Case Missing',
            severity: 'MEDIUM' // 3 points * 4 = 12 points (exceeds 10)
        });
        await mistake.save();
        mistakeCount++;
    }
    // QA 2 Same Project Trigger (Project Ledger)
    const qa2 = qas[1];
    const ledgerReq = requirements.find(r => r.project === 'Project Ledger') || requirements[0];
    for (let i = 0; i < 2; i++) {
        const mistake = new Mistake_1.Mistake({
            qa: qa2._id,
            requirement: ledgerReq._id,
            project: 'Project Ledger',
            category: ledgerReq.category,
            mistakeType: 'Ambiguous Flow',
            severity: 'HIGH' // 5 points * 2 = 10 points (exceeds 10)
        });
        await mistake.save();
        mistakeCount++;
    }
    // Seed the other 24 mistakes randomly across QAs
    for (let i = mistakeCount; i < 30; i++) {
        const qa = qas[i % qas.length];
        const req = requirements[i % requirements.length];
        const mistake = new Mistake_1.Mistake({
            qa: qa._id,
            requirement: req._id,
            project: req.project,
            category: req.category,
            mistakeType: mistakeTypes[i % mistakeTypes.length],
            severity: severities[i % severities.length]
        });
        await mistake.save();
        mistakeCount++;
    }
    console.log(`Seeded ${mistakeCount} Mistakes.`);
    // 7. Seed 10 Assessments
    console.log('Seeding 10 Assessments (including triggered pending ones and completed ones)...');
    // Triggered assessments for QA 1 and QA 2
    const assessments = [];
    // QA 1 Assessment (Category Triggered)
    const qa1Mistakes = await Mistake_1.Mistake.find({ qa: qa1._id });
    const a1 = new Assessment_1.Assessment({
        qa: qa1._id,
        triggeredMistakes: qa1Mistakes.map(m => m._id),
        totalWeight: 12,
        questions: [
            'Detail your QA validation approach for boundary edges in Fintech requirements.',
            'Explain how you ensure checklist accuracy when verifying PCI-DSS constraints.'
        ],
        status: 'PENDING'
    });
    await a1.save();
    assessments.push(a1);
    // QA 2 Assessment (Project Triggered)
    const qa2Mistakes = await Mistake_1.Mistake.find({ qa: qa2._id });
    const a2 = new Assessment_1.Assessment({
        qa: qa2._id,
        triggeredMistakes: qa2Mistakes.map(m => m._id),
        totalWeight: 10,
        questions: [
            'Detail your QA validation approach for ambiguous specifications.',
            'How do you check for concurrency bottlenecks in fintech ledger accounts?'
        ],
        status: 'PENDING'
    });
    await a2.save();
    assessments.push(a2);
    // Historical completed assessments for QAs to show average scores
    for (let i = 0; i < 6; i++) { // First 6 QAs get historical assessments
        const histAssesment = new Assessment_1.Assessment({
            qa: qas[i]._id,
            triggeredMistakes: [],
            totalWeight: 10,
            questions: [
                'How do you check for basic validation rules?',
                'Describe your process for identifying missed edge cases.'
            ],
            answers: ['I run a basic matrix check.', 'I look at the boundary constraints.'],
            status: 'COMPLETED',
            score: 80 + i * 2, // 80, 82, 84, 86, 88, 90
            completedAt: new Date(Date.now() - 86400000 * (i + 1))
        });
        await histAssesment.save();
        assessments.push(histAssesment);
    }
    console.log(`Seeded ${assessments.length} Assessments.`);
    console.log('Database Seeding Completed Successfully!');
    await mongoose_1.default.disconnect();
    console.log('Disconnected.');
}
seed().catch(err => {
    console.error('Production Seeding Failed:', err);
    process.exit(1);
});
