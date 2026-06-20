"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparativeValidationService = void 0;
const Requirement_1 = require("../models/Requirement");
const Report_1 = require("../models/Report");
const ValidationResult_1 = require("../models/ValidationResult");
const CoverageService_1 = require("./CoverageService");
const VersionCompareService_1 = require("./VersionCompareService");
class ComparativeValidationService {
    static async runValidation(requirementId, qaFindings, modifiedDescription) {
        const current = await Requirement_1.Requirement.findById(requirementId);
        if (!current) {
            throw new Error('Requirement not found');
        }
        // Mark previous ValidationResult records as inactive before recomputation
        await ValidationResult_1.ValidationResult.updateMany({ requirement: requirementId }, { isActive: false });
        // 1. Checklist Coverage
        const checklistCoverage = await CoverageService_1.CoverageService.calculateCoverage(requirementId);
        // 2. Similarity Percentage (against other requirements in the same category)
        const historicalReqs = await Requirement_1.Requirement.find({
            category: current.category,
            _id: { $ne: current._id }
        });
        let maxSimilarity = null;
        const descToValidate = modifiedDescription || current.description;
        const currentWords = new Set(descToValidate.toLowerCase().match(/\b\w+\b/g) || []);
        if (historicalReqs.length > 0) {
            maxSimilarity = 0;
            for (const hist of historicalReqs) {
                const histWords = new Set(hist.description.toLowerCase().match(/\b\w+\b/g) || []);
                const intersection = new Set([...currentWords].filter((x) => histWords.has(x)));
                const union = new Set([...currentWords, ...histWords]);
                if (union.size > 0) {
                    const sim = Math.round((intersection.size / union.size) * 100);
                    if (sim > maxSimilarity) {
                        maxSimilarity = sim;
                    }
                }
            }
        }
        // 3. Missing Sections Warning
        const missingSections = [];
        const descLower = descToValidate.toLowerCase();
        const standardHeaders = {
            Fintech: ['security', 'audit trail', 'transaction limits', 'pci compliance'],
            Healthcare: ['hipaa', 'patient consent', 'privacy', 'access logging'],
            'E-commerce': ['cart', 'payment', 'inventory', 'discount'],
            General: ['roles', 'permissions', 'validation', 'error handling']
        };
        const headersToCheck = standardHeaders[current.category] || standardHeaders.General;
        for (const header of headersToCheck) {
            if (!descLower.includes(header)) {
                missingSections.push(`Missing section: "${header.toUpperCase()}" configurations not explicitly detailed.`);
            }
        }
        // 4. Version Changes
        const versionChanges = await VersionCompareService_1.VersionCompareService.compareVersions(requirementId);
        // 5. Conflict Alerts
        const conflictAlerts = [];
        // Check conflicts in current text/findings
        const checkText = `${descToValidate} ${qaFindings?.summary || ''} ${qaFindings?.missingFeatures?.join(' ') || ''}`.toLowerCase();
        // Check for contradictory terms (e.g. http vs https, admin can delete vs admin cannot delete)
        if (checkText.includes('http://') && current.category === 'Fintech') {
            conflictAlerts.push('Security Conflict: Non-secure protocol http:// specified for a Fintech category requirement.');
        }
        if (checkText.includes('no encryption') || checkText.includes('disable tls')) {
            conflictAlerts.push('Security Warning: Encryption suppression keywords detected.');
        }
        if (checkText.includes('allow plain text password')) {
            conflictAlerts.push('Privacy Warning: Password exposure policy conflict.');
        }
        if (checkText.includes('latency') && (checkText.includes('batch process') || checkText.includes('batch processing'))) {
            conflictAlerts.push('Performance Conflict: Low latency expectations contradict batch processing configurations.');
        }
        // If QA manual findings list a risk or missing feature, validate it against historical reports
        if (qaFindings && qaFindings.missingFeatures.length > 0) {
            // Find similar historical reports
            const historicalReports = await Report_1.Report.find({
                requirement: { $in: historicalReqs.map(r => r._id) }
            });
            for (const reqFeat of qaFindings.missingFeatures) {
                const isCommonlyMissing = historicalReports.some(rep => rep.missingFeatures.some(feat => feat.toLowerCase().includes(reqFeat.toLowerCase())));
                if (isCommonlyMissing) {
                    conflictAlerts.push(`Pattern Alert: "${reqFeat}" is a historically recurring missing feature in this category.`);
                }
            }
        }
        let validationResult;
        try {
            // Save/cache new active ValidationResult
            validationResult = new ValidationResult_1.ValidationResult({
                requirement: requirementId,
                checklistCoverage,
                similarity: maxSimilarity,
                missingSections,
                versionChanges,
                conflictAlerts,
                isActive: true,
                createdAt: new Date()
            });
            await validationResult.save();
            // Associate the new validationResult with any existing reports for this requirement
            await Report_1.Report.updateMany({ requirement: requirementId }, { validationResult: validationResult._id });
        }
        catch (error) {
            if (error.code === 11000 || error.message?.includes('E11000')) {
                console.log('Duplicate key error caught during concurrent validation. Fetching existing active ValidationResult.');
                const existingVal = await ValidationResult_1.ValidationResult.findOne({
                    requirement: requirementId,
                    isActive: true
                });
                if (existingVal) {
                    return existingVal;
                }
            }
            throw error;
        }
        return validationResult;
    }
}
exports.ComparativeValidationService = ComparativeValidationService;
exports.default = ComparativeValidationService;
