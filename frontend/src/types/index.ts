export type UserRole = 'ADMIN' | 'QA' | 'CLIENT';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type RequirementStatus =
  | 'DRAFT'
  | 'ASSIGNED'
  | 'UNDER_ANALYSIS'
  | 'REPORT_GENERATED'
  | 'UNDER_REVIEW'
  | 'CLIENT_REVIEW'
  | 'REVALIDATION'
  | 'FINALIZED'
  | 'CANCELED';

export interface Requirement {
  _id: string;
  title: string;
  description: string;
  client: User | string;
  assignedQA?: User;
  category: string;
  project: string;
  status: RequirementStatus;
  version: number;
  originalRequirementId?: string;
  parentVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  text: string;
  result: 'Pass' | 'Fail' | 'N/S';
}

export interface AIQualityGateCheck {
  criterion: string;
  result: 'PASS' | 'FAIL' | 'N/S';
  reason?: string;
  recommendation?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AIQualityEvaluation {
  detected_domain: string;
  checklist: AIQualityGateCheck[];
  report: {
    overall_status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
    score_percentage: number;
    summary: string;
  };
}

export interface RequirementChecklist {
  _id: string;
  requirement: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  _id: string;
  requirement: string;
  checklistCoverage: number;
  similarity: number;
  missingSections: string[];
  versionChanges: string[];
  conflictAlerts: string[];
  createdAt: string;
}

export interface QAFindingsPayload {
  summary: string;
  missingFeatures: string[];
  risks: string[];
  comments?: string;
}

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'APPROVED_INTERNAL' | 'SENT_TO_CLIENT' | 'REJECTED';

export interface Report {
  _id: string;
  requirement: string;
  qa: User | string;
  summary: string;
  missingFeatures: string[];
  risks: string[];
  comments?: string;
  validationResult?: ValidationResult;
  status: ReportStatus;
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientDecisionType =
  | 'ACCEPT'
  | 'REJECT_KEEP_ORIGINAL'
  | 'REJECT_RECOMMENDATION'
  | 'MODIFY_VERSION'
  | 'MODIFY_FINALIZE';

export interface ReviewDecision {
  _id: string;
  requirementId: string;
  decision: ClientDecisionType;
  comments?: string;
  modifiedVersion?: string;
  createdAt: string;
}

export type NotificationType = 'ASSIGNMENT' | 'REVIEW' | 'CLIENT_DECISION' | 'ASSESSMENT';

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export type SeverityType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Mistake {
  _id: string;
  qa: string;
  requirement: string;
  project: string;
  category: string;
  mistakeType: string;
  severity: SeverityType;
  createdAt: string;
}

export type AssessmentStatus = 'PENDING' | 'COMPLETED';

export interface Assessment {
  _id: string;
  qa: User | string;
  triggeredMistakes: Mistake[] | string[];
  totalWeight: number;
  questions: string[];
  answers: string[];
  score: number;
  status: AssessmentStatus;
  deadline: string;
  penaltyCharge: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
