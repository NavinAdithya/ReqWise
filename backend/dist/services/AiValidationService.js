"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiValidationService = void 0;
const genai_1 = require("@google/genai");
const Report_1 = require("../models/Report");
const Requirement_1 = require("../models/Requirement");
class AiValidationService {
    static async validateReport(reportId) {
        const report = await Report_1.Report.findById(reportId).populate('qa');
        if (!report) {
            throw new Error('Report not found');
        }
        const requirement = await Requirement_1.Requirement.findById(report.requirement);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not configured.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
      You are an expert QA Manager AI. 
      Review the following requirement specifications and the QA analysis report submitted by the QA analyst.
      
      Requirement Title: ${requirement.title}
      Requirement Category: ${requirement.category}
      Requirement Specifications:
      ${requirement.description}

      QA Report Summary:
      ${report.summary}
      QA Reported Missing Features:
      ${report.missingFeatures.join(', ') || 'None'}
      QA Reported Risks:
      ${report.risks.join(', ') || 'None'}
      QA Comments:
      ${report.comments || 'None'}

      Provide a JSON response with the following structure exactly (do not wrap in markdown tags like \`\`\`json):
      {
        "confidenceScore": <number between 0 and 100 representing how confident you are in the QA's report accuracy>,
        "aiFeedback": "<string providing your detailed analysis and reasoning. Write 2-3 sentences.>",
        "detectedDiscrepancies": [<array of strings listing any discrepancies between the report and the actual requirement, if any>],
        "recommendation": "<string: 'APPROVE' or 'REJECT'>"
      }
    `;
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt
            });
            const responseText = result.text || '';
            // Clean markdown code blocks if the model wrapped the JSON
            const cleanedText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
            const parsed = JSON.parse(cleanedText);
            return parsed;
        }
        catch (error) {
            console.error('AI Validation Error:', error);
            throw new Error('Failed to generate AI validation. ' + error.message);
        }
    }
    static async runComparativeAnalysis(reportId) {
        const report = await Report_1.Report.findById(reportId).populate('qa');
        if (!report) {
            throw new Error('Report not found');
        }
        const requirement = await Requirement_1.Requirement.findById(report.requirement);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not configured.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
      You are an expert Requirements Analyst and QA Manager.
      Perform a strict, fact-based comparative analysis between the Original Requirement Specification and the submitted QA Report.

      Original Requirement Title: ${requirement.title}
      Original Requirement Details:
      ${requirement.description}

      QA Report Summary:
      ${report.summary}
      QA Identified Missing Features: ${report.missingFeatures.length ? report.missingFeatures.join(', ') : 'None'}
      QA Identified Risks: ${report.risks.length ? report.risks.join(', ') : 'None'}
      QA Additional Comments: ${report.comments || 'None'}

      CRITICAL ANTI-HALLUCINATION RULES:
      1. You MUST NOT invent, assume, or hallucinate any features, constraints, or risks that are not explicitly stated in the texts above.
      2. If the QA Analyst identified a missing feature or risk that has ABSOLUTELY NOTHING to do with the original requirement's scope, you MUST flag it as a "Fake Analysis / Hallucination" and recommend REJECT.
      3. Your evaluation must be strictly grounded in comparing the exact text of the requirement against the exact text of the QA report.

      CRITICAL DOMAIN-SPECIFIC RULES:
      Enforce basic domain-specific rules based on the category:
      - "Web Development": Must define the tech stack.
      - "Fintech": Must define security standards like PCI-DSS.
      - "E-commerce": Must define payment flow and security.
      - "Healthcare": Must define patient data privacy (HIPAA).
      If a critical domain-specific criterion is missing from the Requirement AND the QA Analyst failed to flag it as a missing feature or risk, you must heavily penalize the report and recommend REJECT.

      Provide a JSON response with exactly this structure:
      {
        "highlightedResult": "<string containing a Github Flavored Markdown TABLE. Provide a detailed tabular column comparing 'Feature / Risk (from QA Report)', 'Is it relevant to Requirement?', 'QA Report State', and 'Your Evaluation'. Below the table, provide a strict 2-3 sentence summary of your findings.>",
        "recommendation": "<string: must be exactly 'APPROVE', 'REJECT', or 'SEND_TO_CLIENT'>"
      }

      Recommendation Guidelines:
      - 'REJECT': The QA report contains fake/hallucinated features or risks not relevant to the requirement, OR missed flagging a missing critical domain rule.
      - 'APPROVE': The QA report accurately identifies valid missing features/risks based on the requirement, with no hallucinations.
      - 'SEND_TO_CLIENT': The QA report perfectly captures all requirements, found no fake issues, and is ready for external release.
    `;
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt
            });
            const responseText = result.text || '';
            const cleanedText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
            const parsed = JSON.parse(cleanedText);
            return parsed;
        }
        catch (error) {
            console.error('AI Comparative Analysis Error:', error);
            throw new Error('Failed to generate comparative analysis. ' + error.message);
        }
    }
    static async evaluateRequirementQuality(requirementId) {
        const requirement = await Requirement_1.Requirement.findById(requirementId);
        if (!requirement) {
            throw new Error('Requirement not found');
        }
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is not configured.');
        }
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
      You are the REQWISE Requirement Quality Gate. When given a requirement text, you must:
      1. Detect the domain from the requirement text.
      2. Build a relevant checklist based on that domain.
      3. Evaluate the requirement against that checklist.
      4. Return a structured JSON report.

      ## EVALUATION RULES
      1. Read only what is written. Do not assume, infer, or fill in gaps.
      2. If something is vague, implied but not stated, or only partially mentioned — that is a FAIL, not a PASS.
      3. Every FAIL must include:
         - recommendation: the exact sentence or detail the author must add to fix it.
         - severity: HIGH if it blocks testing or introduces risk, MEDIUM if it reduces clarity or completeness, LOW if it is a minor gap.
      4. Do not add recommendation or severity keys for PASS or N/S results.
      5. Return ONLY valid JSON. No text, no markdown, no code fences before or after it.

      ## STEP 1 — DETECT DOMAIN
      Read the requirement text and identify which domain it belongs to from this list:
      E-Commerce, Healthcare, Finance, Authentication, Dashboard & Analytics, Notification System, File Management, User Management, API Integration, General Software.
      If the domain does not match any listed, use General Software.

      ## STEP 2 — BUILD CHECKLIST CRITERIA
      Always include these 3 universal criteria:
      - Requirement is clear
      - No contradiction found
      - Test cases can be created

      Then add domain-specific criteria based on the detected domain:

      E-Commerce:
      - Payment flow is fully defined
      - Security and fraud prevention is addressed
      - Inventory and stock handling is specified
      - User roles for buyer and seller are defined

      Healthcare:
      - Patient data privacy requirements are stated
      - Regulatory compliance is referenced (e.g. HIPAA)
      - Audit trail requirements are defined
      - Access control per role is specified

      Finance:
      - Transaction accuracy and validation rules are defined
      - Regulatory compliance is referenced
      - Audit logging requirements are stated
      - Failure and rollback behaviour is specified

      Authentication:
      - Authentication method is explicitly defined
      - Session handling and expiry is specified
      - Password and security policy is stated
      - Failed attempt behaviour is defined

      Dashboard & Analytics:
      - Data sources are identified
      - Refresh or update interval is defined
      - Chart or visualisation types are specified
      - Access roles for viewing data are stated

      Notification System:
      - Trigger conditions for notifications are listed
      - Delivery channels are specified (email, SMS, push)
      - Retry or failure handling is defined
      - Opt-in or opt-out behaviour is addressed

      File Management:
      - Allowed file types and size limits are stated
      - Storage location or provider is specified
      - Access control per file is defined
      - Versioning or deletion behaviour is addressed

      User Management:
      - User roles and permissions are explicitly defined
      - Account creation and deactivation flow is stated
      - Password reset and recovery process is described
      - Audit logging for user actions is addressed

      API Integration:
      - External APIs are named with endpoint details
      - Authentication method for each integration is defined
      - Error handling and retry logic is specified
      - Data format and schema are described

      General Software:
      - Requirement is complete
      - No missing information
      - Requirement is understandable

      ## STEP 3 — EVALUATE AND RETURN JSON
      Evaluate the requirement against the criteria built in Step 2 and return this exact structure:
      {
        "detected_domain": "<domain name>",
        "checklist": [
          {
            "criterion": "<criterion name>",
            "result": "PASS or FAIL or N/S",
            "reason": "One sentence based only on the requirement text.",
            "recommendation": "Only present if result is FAIL. Exact sentence or detail the author must add.",
            "severity": "Only present if result is FAIL. HIGH or MEDIUM or LOW."
          }
        ],
        "report": {
          "requirement_name": "<name or first 8 words of the requirement>",
          "summary": "2 to 3 sentences on overall quality and key issues found.",
          "total_pass": <number>,
          "total_fail": <number>,
          "total_ns": <number>,
          "high_severity_count": <number of FAILs where severity is HIGH>,
          "admin_notes": "2 to 3 sentences highlighting the most critical gaps the Admin should consider before finalizing. Write None if all criteria passed."
        }
      }

      Requirement Text to Evaluate:
      Title: ${requirement.title}
      Description:
      ${requirement.description}
    `;
        try {
            const result = await ai.models.generateContent({
                model: 'gemini-3.5-flash',
                contents: prompt
            });
            const responseText = result.text || '';
            const cleanedText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
            const parsed = JSON.parse(cleanedText);
            return parsed;
        }
        catch (error) {
            console.error('AI Requirement Quality Gate Error:', error);
            throw new Error('Failed to run requirement quality gate. ' + error.message);
        }
    }
}
exports.AiValidationService = AiValidationService;
exports.default = AiValidationService;
