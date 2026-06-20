import mongoose from 'mongoose';
import supertest from 'supertest';
import app from '../index';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Requirement } from '../models/Requirement';
import { RequirementChecklist } from '../models/RequirementChecklist';
import { ValidationResult } from '../models/ValidationResult';
import { Report } from '../models/Report';
import { ReviewDecision } from '../models/ReviewDecision';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { Mistake } from '../models/Mistake';
import { Assessment } from '../models/Assessment';

const request = supertest(app);

describe('REQWISE Full Backend Integration & Verification Tests', () => {
  let adminToken: string;
  let qaToken: string;
  let clientToken: string;

  let adminId: string;
  let qaId: string;
  let clientId: string;

  let requirementId: string;
  let reportId: string;

  beforeAll(async () => {
    delete process.env.GEMINI_API_KEY;
    // Connect to the test DB
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clear all collections
    await User.deleteMany({});
    await Requirement.deleteMany({});
    await RequirementChecklist.deleteMany({});
    await ValidationResult.deleteMany({});
    await Report.deleteMany({});
    await ReviewDecision.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});
    await Mistake.deleteMany({});
    await Assessment.deleteMany({});

    // Seed test users
    const adminRes = await request.post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@reqwise.com',
      password: 'password123',
      role: 'ADMIN'
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body.user._id;

    const qaRes = await request.post('/api/auth/register').send({
      name: 'QA User',
      email: 'qa@reqwise.com',
      password: 'password123',
      role: 'QA'
    });
    qaToken = qaRes.body.token;
    qaId = qaRes.body.user._id;

    const clientRes = await request.post('/api/auth/register').send({
      name: 'Client User',
      email: 'client@reqwise.com',
      password: 'password123',
      role: 'CLIENT'
    });
    clientToken = clientRes.body.token;
    clientId = clientRes.body.user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // STEP 4: DATABASE VALIDATION
  describe('STEP 4: Database Model Validation', () => {
    test('Schemas contain all required fields and references', async () => {
      // Create Requirement Checklist
      const req = new Requirement({
        title: 'Fintech Transaction System',
        description: 'System to process transactions with audit trail and security constraints.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Project Transaction'
      });
      await req.save();
      requirementId = req._id.toString();
      expect(req.status).toBe('DRAFT');
      expect(req.version).toBe(1);

      const checklist = new RequirementChecklist({
        requirement: req._id,
        checklistVersion: 2,
        items: [{ text: 'Verify audit trail logging', result: 'N/S' }]
      });
      await checklist.save();
      expect(checklist.items[0].result).toBe('N/S');

      const valRes = new ValidationResult({
        requirement: req._id,
        checklistCoverage: 80,
        similarity: 65,
        missingSections: ['Missing audit trail details'],
        versionChanges: [],
        conflictAlerts: []
      });
      await valRes.save();

      const report = new Report({
        requirement: req._id,
        qa: new mongoose.Types.ObjectId(qaId),
        summary: 'Manual report summary details',
        missingFeatures: ['Transaction throttling missing'],
        risks: ['Race condition on payment webhook'],
        validationResult: valRes._id,
        status: 'DRAFT'
      });
      await report.save();
      reportId = report._id.toString();

      const decision = new ReviewDecision({
        requirementId: req._id,
        decision: 'ACCEPT'
      });
      await decision.save();

      const notification = new Notification({
        user: req.client,
        type: 'ASSIGNMENT',
        message: 'Test notification'
      });
      await notification.save();
      expect(notification.read).toBe(false);

      const audit = new AuditLog({
        actor: new mongoose.Types.ObjectId(adminId),
        action: 'TEST_ACTION',
        entity: 'Requirement',
        entityId: req._id
      });
      await audit.save();

      const mistake = new Mistake({
        qa: new mongoose.Types.ObjectId(qaId),
        requirement: req._id,
        project: 'Project Transaction',
        category: 'Fintech',
        mistakeType: 'Ambiguous Requirement',
        severity: 'MEDIUM'
      });
      await mistake.save();

      const assessment = new Assessment({
        qa: new mongoose.Types.ObjectId(qaId),
        triggeredMistakes: [mistake._id],
        totalWeight: 3,
        questions: ['Question A'],
        answers: ['Answer A']
      });
      await assessment.save();
      expect(assessment.status).toBe('PENDING');
    });
  });

  // STEP 5: RBAC TEST
  describe('STEP 5: Role-Based Access Control (RBAC) Protections', () => {
    test('QA cannot assign or review reports', async () => {
      // QA tries to assign QA (Should be 403)
      const res1 = await request
        .patch(`/api/requirements/${requirementId}/assign`)
        .set('Authorization', `Bearer ${qaToken}`)
        .send({ assignedQAId: qaId });
      expect(res1.status).toBe(403);

      // QA tries to review report (Should be 403)
      const res2 = await request
        .post('/api/reviews')
        .set('Authorization', `Bearer ${qaToken}`)
        .send({ reportId, action: 'APPROVE' });
      expect(res2.status).toBe(403);
    });

    test('Client cannot assign or review reports', async () => {
      const res1 = await request
        .patch(`/api/requirements/${requirementId}/assign`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ assignedQAId: qaId });
      expect(res1.status).toBe(403);

      const res2 = await request
        .post('/api/reviews')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ reportId, action: 'APPROVE' });
      expect(res2.status).toBe(403);
    });

    test('Admin cannot submit reports', async () => {
      const res = await request
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requirementId,
          summary: 'Summary by admin',
          missingFeatures: [],
          risks: []
        });
      expect(res.status).toBe(403);
    });

    test('Admin can assign and review reports', async () => {
      // Re-initialize a test requirement in DRAFT
      const newReq = await Requirement.create({
        title: 'New Fintech Requirement',
        description: 'New requirement description with audit trail logging details.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Project Alpha'
      });
      await RequirementChecklist.create({ requirement: newReq._id, checklistVersion: 2, items: [] });

      // Admin assigns QA (Should be 200)
      const assignRes = await request
        .patch(`/api/requirements/${newReq._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedQAId: qaId });
      expect(assignRes.status).toBe(200);

      // Check state transition to ASSIGNED
      const updatedReq = await Requirement.findById(newReq._id);
      expect(updatedReq?.status).toBe('ASSIGNED');
    });
  });

  // STEP 6: STATE MACHINE TEST
  describe('STEP 6: Requirement State Machine Transitions', () => {
    test('Transitions from DRAFT -> ASSIGNED -> UNDER_ANALYSIS -> REPORT_GENERATED -> UNDER_REVIEW -> CLIENT_REVIEW -> FINALIZED are valid', async () => {
      const req = await Requirement.create({
        title: 'State Test Req',
        description: 'Test transitions flow description with standard features.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Proj State'
      });
      await RequirementChecklist.create({ requirement: req._id, checklistVersion: 2, items: [] });

      // DRAFT -> ASSIGNED (via Admin assign)
      const res1 = await request
        .patch(`/api/requirements/${req._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedQAId: qaId });
      expect(res1.status).toBe(200);

      // ASSIGNED -> UNDER_ANALYSIS -> REPORT_GENERATED (via QA drafting report)
      const res2 = await request
        .post('/api/reports')
        .set('Authorization', `Bearer ${qaToken}`)
        .send({
          requirementId: req._id.toString(),
          summary: 'Manual summary description',
          missingFeatures: ['Feature 1'],
          risks: ['Risk 1']
        });
      expect(res2.status).toBe(200);

      // REPORT_GENERATED -> UNDER_REVIEW (via QA submitting report)
      const reportId = res2.body.report._id;
      const res3 = await request
        .post(`/api/reports/${reportId}/submit`)
        .set('Authorization', `Bearer ${qaToken}`);
      expect(res3.status).toBe(200);

      // UNDER_REVIEW -> CLIENT_REVIEW (via Admin approve)
      const res4 = await request
        .post('/api/reviews')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId,
          action: 'SEND_TO_CLIENT',
          feedback: 'Looks good'
        });
      expect(res4.status).toBe(200);

      // CLIENT_REVIEW -> FINALIZED (via Client accept)
      const res5 = await request
        .post('/api/reviews/client/decision')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          requirementId: req._id.toString(),
          decision: 'ACCEPT',
          comments: 'Closing requirements'
        });
      expect(res5.status).toBe(200);

      const finalReq = await Requirement.findById(req._id);
      expect(finalReq?.status).toBe('FINALIZED');
    });

    test('Invalid transitions are blocked and return 400', async () => {
      const req = await Requirement.create({
        title: 'Invalid State Req',
        description: 'Test description.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Proj State'
      });

      // Try DRAFT -> UNDER_ANALYSIS directly (Should fail since it must go to ASSIGNED first)
      const res1 = await request
        .post('/api/reports')
        .set('Authorization', `Bearer ${qaToken}`)
        .send({
          requirementId: req._id.toString(),
          summary: 'Summary draft',
          missingFeatures: [],
          risks: []
        });
      // Should return 400 or 403 due to not assigned or invalid transition
      expect(res1.status).toBe(400);

      // Try transitions on FINALIZED requirement (e.g. assign QA)
      req.status = 'FINALIZED';
      await req.save();

      const res2 = await request
        .patch(`/api/requirements/${req._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assignedQAId: qaId });
      expect(res2.status).toBe(400); // Invalid status transition from FINALIZED to ASSIGNED
    });
  });

  // STEP 8: COMPARATIVE VALIDATION TEST
  describe('STEP 8: Comparative Validation Engine Verification', () => {
    test('Validation results verify checklist coverage and flags warnings without auto-generation', async () => {
      // Seed a historical requirement
      await Requirement.create({
        title: 'Historical Fintech Portal',
        description: 'Fintech description with pci compliance and audit trail configurations.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Project Portal',
        status: 'FINALIZED'
      });

      // Create new requirement
      const req = await Requirement.create({
        title: 'New Fintech Portal',
        description: 'Basic portal upload description.',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Project Portal'
      });

      const checklist = await RequirementChecklist.create({
        requirement: req._id,
        checklistVersion: 2,
        items: [
          { text: 'Verify transactional boundaries and concurrency', result: 'Pass' },
          { text: 'Verify PCI-DSS / Encryption standards for payload', result: 'N/S' }
        ]
      });

      const validationRes = await request
        .post('/api/reports/validation/run')
        .set('Authorization', `Bearer ${qaToken}`)
        .send({
          requirementId: req._id.toString(),
          qaFindings: {
            summary: 'QA checked the transaction parameters',
            missingFeatures: ['PCI-DSS compliance'],
            risks: [' webhook endpoint lacks retry policies']
          }
        });

      expect(validationRes.status).toBe(200);
      const valResult = validationRes.body.validationResult;

      // Ensure coverage is calculated (1 out of 2 items checked = 50%)
      expect(valResult.checklistCoverage).toBe(50);

      // Ensure missing sections are flagged as warnings (Fintech category missing standard terms like "pci compliance" or "audit trail")
      expect(valResult.missingSections.length).toBeGreaterThan(0);
      expect(valResult.missingSections[0]).toContain('Missing section');

      // Human-first verification: Ensure NO recommendations or answers are generated in the validation results
      expect(valResult.recommendations).toBeUndefined();
      expect(valResult.answers).toBeUndefined();
      expect(valResult.findings).toBeUndefined();
    });
  });

  // STEP 9: ASSESSMENT ENGINE TEST
  describe('STEP 9: Mistake Tracking & Assessment Engine triggers', () => {
    beforeEach(async () => {
      await Mistake.deleteMany({});
      await Assessment.deleteMany({});
    });

    test('Case 1: Single mistake is ignored and does not trigger assessment', async () => {
      const req = await Requirement.create({
        title: 'Req Mistake 1',
        description: 'Desc',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Proj Mistake 1'
      });

      const res = await request
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qaId,
          requirementId: req._id.toString(),
          mistakeType: 'Ambiguous Flow',
          severity: 'HIGH' // Weight = 5 (threshold is >=10)
        });

      expect(res.status).toBe(201);
      expect(res.body.triggeredAssessment).toBeNull();

      const assessments = await Assessment.find({ qa: qaId });
      expect(assessments.length).toBe(0);
    });

    test('Case 2: Same mistake 2+ times in the same project triggers assessment when weight >= 10', async () => {
      const req = await Requirement.create({
        title: 'Req Mistake 2',
        description: 'Desc',
        client: new mongoose.Types.ObjectId(clientId),
        category: 'Fintech',
        project: 'Proj Mistake 2'
      });

      // Log 1st mistake (weight = 5)
      await request
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qaId,
          requirementId: req._id.toString(),
          mistakeType: 'Ambiguous Flow',
          severity: 'HIGH'
        });

      // Log 2nd mistake (weight = 5, same project, same type)
      const res = await request
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qaId,
          requirementId: req._id.toString(),
          mistakeType: 'Ambiguous Flow',
          severity: 'HIGH'
        });

      expect(res.status).toBe(201);
      expect(res.body.triggeredAssessment).not.toBeNull();
      expect(res.body.triggeredAssessment.status).toBe('PENDING');
      expect(res.body.triggeredAssessment.totalWeight).toBe(10);
    });

    test('Case 3: Same mistake in 3-4 projects of same category triggers assessment when weight >= 10', async () => {
      const req1 = await Requirement.create({ title: 'Req 1', description: 'D', client: new mongoose.Types.ObjectId(clientId), category: 'Fintech', project: 'P1' });
      const req2 = await Requirement.create({ title: 'Req 2', description: 'D', client: new mongoose.Types.ObjectId(clientId), category: 'Fintech', project: 'P2' });
      const req3 = await Requirement.create({ title: 'Req 3', description: 'D', client: new mongoose.Types.ObjectId(clientId), category: 'Fintech', project: 'P3' });
      const req4 = await Requirement.create({ title: 'Req 4', description: 'D', client: new mongoose.Types.ObjectId(clientId), category: 'Fintech', project: 'P4' });

      // Log same mistake type across 4 different projects in same category
      // Medium severity = 3 points. 4 projects * 3 points = 12 points (threshold >= 10)
      await request.post('/api/mistakes').set('Authorization', `Bearer ${adminToken}`).send({ qaId, requirementId: req1._id.toString(), mistakeType: 'Boundary Edge Case Missing', severity: 'MEDIUM' });
      await request.post('/api/mistakes').set('Authorization', `Bearer ${adminToken}`).send({ qaId, requirementId: req2._id.toString(), mistakeType: 'Boundary Edge Case Missing', severity: 'MEDIUM' });
      await request.post('/api/mistakes').set('Authorization', `Bearer ${adminToken}`).send({ qaId, requirementId: req3._id.toString(), mistakeType: 'Boundary Edge Case Missing', severity: 'MEDIUM' });
      
      const res = await request
        .post('/api/mistakes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          qaId,
          requirementId: req4._id.toString(),
          mistakeType: 'Boundary Edge Case Missing',
          severity: 'MEDIUM'
        });

      expect(res.status).toBe(201);
      expect(res.body.triggeredAssessment).not.toBeNull();
      expect(res.body.triggeredAssessment.totalWeight).toBe(12);
    });
  });
});
