"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentService = void 0;
const Mistake_1 = require("../models/Mistake");
const Assessment_1 = require("../models/Assessment");
const NotificationService_1 = require("./NotificationService");
const genai_1 = require("@google/genai");
class AssessmentService {
    static async evaluateMistakesAndTriggerAssessment(qaId) {
        const mistakes = await Mistake_1.Mistake.find({ qa: qaId });
        if (mistakes.length === 0) {
            return null;
        }
        // Group mistakes by mistakeType
        const groupedByType = {};
        for (const m of mistakes) {
            if (!groupedByType[m.mistakeType]) {
                groupedByType[m.mistakeType] = [];
            }
            groupedByType[m.mistakeType].push(m);
        }
        const triggeredMistakes = [];
        // Evaluate each group of same mistakeType
        for (const [type, list] of Object.entries(groupedByType)) {
            if (list.length <= 1) {
                // Single mistake -> Ignore
                continue;
            }
            // Check "Same Project Trigger": same mistakeType >= 2 in same project
            const groupedByProject = {};
            for (const m of list) {
                if (!groupedByProject[m.project]) {
                    groupedByProject[m.project] = [];
                }
                groupedByProject[m.project].push(m);
            }
            for (const [proj, projMistakes] of Object.entries(groupedByProject)) {
                if (projMistakes.length >= 2) {
                    // Add all mistakes in this project to triggered list
                    for (const pm of projMistakes) {
                        if (!triggeredMistakes.some((t) => t._id.toString() === pm._id.toString())) {
                            triggeredMistakes.push(pm);
                        }
                    }
                }
            }
            // Check "Same Category Trigger": same mistakeType in >= 3 different projects under same category
            const groupedByCategory = {};
            for (const m of list) {
                if (!groupedByCategory[m.category]) {
                    groupedByCategory[m.category] = {};
                }
                if (!groupedByCategory[m.category][m.project]) {
                    groupedByCategory[m.category][m.project] = [];
                }
                groupedByCategory[m.category][m.project].push(m);
            }
            for (const [cat, projectsMap] of Object.entries(groupedByCategory)) {
                const uniqueProjects = Object.keys(projectsMap);
                if (uniqueProjects.length >= 3) {
                    // Add all mistakes in these projects under this category to triggered list
                    for (const proj of uniqueProjects) {
                        for (const cm of projectsMap[proj]) {
                            if (!triggeredMistakes.some((t) => t._id.toString() === cm._id.toString())) {
                                triggeredMistakes.push(cm);
                            }
                        }
                    }
                }
            }
        }
        // Now calculate total weight of triggered mistakes
        let totalWeight = 0;
        const severityWeights = {
            LOW: 1,
            MEDIUM: 3,
            HIGH: 5
        };
        for (const tm of triggeredMistakes) {
            totalWeight += severityWeights[tm.severity] || 0;
        }
        // Check if totalWeight >= 10
        if (totalWeight >= 10) {
            // Check if there is an active PENDING assessment
            const existingPending = await Assessment_1.Assessment.findOne({ qa: qaId, status: 'PENDING' });
            if (!existingPending) {
                let questions = [
                    'Describe how you analyze requirements for ambiguities or missing roles.',
                    'Explain your process for validating QA checklist items for functional coverage.',
                    'What steps do you take when the Comparative Validation system flags a missing section or conflict?'
                ];
                try {
                    if (process.env.GEMINI_API_KEY) {
                        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                        const prompt = `
              You are an expert QA Manager training an analyst.
              The QA Analyst has made the following repeated mistakes:
              ${triggeredMistakes.map(m => `- Type: ${m.mistakeType}, Severity: ${m.severity}, Category: ${m.category}`).join('\n')}

              Generate exactly 3 deep, targeted performance assessment questions for this analyst to test their understanding and help them improve specifically on these mistakes.
              Return ONLY a JSON array of 3 strings. Example: ["question 1", "question 2", "question 3"]
            `;
                        const result = await ai.models.generateContent({
                            model: 'gemini-1.5-flash',
                            contents: prompt
                        });
                        const responseText = (result.text || '').replace(/```json\n?|\n?```/gi, '').trim();
                        const parsed = JSON.parse(responseText);
                        if (Array.isArray(parsed) && parsed.length >= 3) {
                            questions = parsed.slice(0, 3);
                        }
                    }
                }
                catch (e) {
                    console.error("AI Question Generation failed, falling back to default.", e);
                }
                const assessment = new Assessment_1.Assessment({
                    qa: qaId,
                    triggeredMistakes: triggeredMistakes.map((m) => m._id),
                    totalWeight,
                    questions,
                    answers: questions.map(() => ''),
                    status: 'PENDING',
                    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                });
                await assessment.save();
                // Notify QA
                await NotificationService_1.NotificationService.notify(qaId, 'ASSESSMENT', `Your mistake score has reached ${totalWeight}. A Performance Assessment has been generated. Please complete it.`);
                return assessment;
            }
            return existingPending;
        }
        return null;
    }
    static async submitAssessmentAnswers(qaId, assessmentId, answers) {
        const assessment = await Assessment_1.Assessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        if (assessment.qa.toString() !== qaId.toString()) {
            throw new Error('You are not authorized to complete this assessment');
        }
        if (assessment.status === 'COMPLETED') {
            throw new Error('Assessment is already completed');
        }
        assessment.answers = answers;
        assessment.status = 'COMPLETED';
        assessment.completedAt = new Date();
        if (assessment.completedAt > assessment.deadline) {
            assessment.penaltyCharge = 50;
        }
        // Simulate grading (simple length-based score or default rating)
        let score = 0;
        for (const ans of answers) {
            if (ans.trim().length > 30) {
                score += 25; // detailed answer
            }
            else if (ans.trim().length > 10) {
                score += 15;
            }
            else {
                score += 5;
            }
        }
        assessment.score = Math.min(score, 100);
        await assessment.save();
        // Notify Admins
        const admins = await User_1.User.find({ role: 'ADMIN' });
        for (const admin of admins) {
            await NotificationService_1.NotificationService.notify(admin._id, 'ASSESSMENT', `QA has completed the performance assessment with a score of ${assessment.score}%.`);
        }
        return assessment;
    }
    static async triggerManualAssessment(qaId) {
        const existingPending = await Assessment_1.Assessment.findOne({ qa: qaId, status: 'PENDING' });
        if (existingPending) {
            throw new Error('QA Analyst already has a pending assessment.');
        }
        const mistakes = await Mistake_1.Mistake.find({ qa: qaId });
        let questions = [
            'Describe how you analyze requirements for ambiguities or missing roles.',
            'Explain your process for validating QA checklist items for functional coverage.',
            'What steps do you take when the Comparative Validation system flags a missing section or conflict?'
        ];
        try {
            if (process.env.GEMINI_API_KEY && mistakes.length > 0) {
                const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const prompt = `
          You are an expert QA Manager training an analyst.
          The QA Analyst has a history of these mistakes:
          ${mistakes.map(m => `- Type: ${m.mistakeType}, Severity: ${m.severity}`).join('\n')}

          Generate exactly 3 deep, targeted performance assessment questions for this analyst to test their understanding and help them improve specifically on these mistakes.
          Return ONLY a JSON array of 3 strings. Example: ["question 1", "question 2", "question 3"]
        `;
                const result = await ai.models.generateContent({
                    model: 'gemini-1.5-flash',
                    contents: prompt
                });
                const responseText = (result.text || '').replace(/```json\n?|\n?```/gi, '').trim();
                const parsed = JSON.parse(responseText);
                if (Array.isArray(parsed) && parsed.length >= 3) {
                    questions = parsed.slice(0, 3);
                }
            }
        }
        catch (e) {
            console.error("AI Question Generation failed, falling back to default.", e);
        }
        const assessment = new Assessment_1.Assessment({
            qa: qaId,
            triggeredMistakes: mistakes.map((m) => m._id),
            totalWeight: 10, // Admin triggered, assume weight threshold met
            questions,
            answers: questions.map(() => ''),
            status: 'PENDING',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        });
        await assessment.save();
        await NotificationService_1.NotificationService.notify(qaId, 'ASSESSMENT', `An Admin has manually triggered a Performance Assessment for you. Please complete it.`);
        return assessment;
    }
}
exports.AssessmentService = AssessmentService;
// User import for notification routing
const User_1 = require("../models/User");
exports.default = AssessmentService;
