"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ComparativeValidationService_1 = require("../services/ComparativeValidationService");
const CoverageService_1 = require("../services/CoverageService");
const Requirement_1 = require("../models/Requirement");
const ValidationResult_1 = require("../models/ValidationResult");
const Report_1 = require("../models/Report");
jest.mock('../models/Requirement');
jest.mock('../models/ValidationResult');
jest.mock('../models/Report');
jest.mock('../services/CoverageService');
jest.mock('../services/VersionCompareService');
describe('Comparative Validation Engine', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Similarity and Coverage calculations are performed correctly', async () => {
        const mockCurrent = {
            _id: 'req1',
            title: 'Transfer Money Flow',
            description: 'System must validate daily limits and pci compliance details.',
            category: 'Fintech',
            project: 'Project Alpha'
        };
        const mockHistorical = [
            {
                _id: 'req2',
                title: 'Send Funds API',
                description: 'System will validate daily limits and pci compliance.',
                category: 'Fintech',
                project: 'Project Alpha'
            }
        ];
        Requirement_1.Requirement.findById.mockResolvedValue(mockCurrent);
        Requirement_1.Requirement.find.mockResolvedValue(mockHistorical);
        CoverageService_1.CoverageService.calculateCoverage.mockResolvedValue(80);
        const mockSave = jest.fn().mockResolvedValue({ _id: 'valresult1' });
        let capturedData = null;
        ValidationResult_1.ValidationResult.mockImplementation((data) => {
            capturedData = data;
            return { save: mockSave };
        });
        ValidationResult_1.ValidationResult.updateMany.mockResolvedValue({});
        Report_1.Report.updateMany.mockResolvedValue({});
        const result = await ComparativeValidationService_1.ComparativeValidationService.runValidation('req1');
        expect(result).toBeDefined();
        // Coverage mock is 80%
        expect(CoverageService_1.CoverageService.calculateCoverage).toHaveBeenCalledWith('req1');
        expect(mockSave).toHaveBeenCalled();
    });
    test('Missing header warnings are generated for Fintech category when standard terms are absent', async () => {
        const mockCurrent = {
            _id: 'req1',
            title: 'Simple Fintech API',
            description: 'Standard basic description without specific headers.',
            category: 'Fintech',
            project: 'Project Alpha'
        };
        Requirement_1.Requirement.findById.mockResolvedValue(mockCurrent);
        Requirement_1.Requirement.find.mockResolvedValue([]);
        CoverageService_1.CoverageService.calculateCoverage.mockResolvedValue(50);
        const mockSave = jest.fn().mockResolvedValue(true);
        let capturedData = null;
        ValidationResult_1.ValidationResult.mockImplementation((data) => {
            capturedData = data;
            return { save: mockSave };
        });
        ValidationResult_1.ValidationResult.updateMany.mockResolvedValue({});
        Report_1.Report.updateMany.mockResolvedValue({});
        await ComparativeValidationService_1.ComparativeValidationService.runValidation('req1');
        // Fintech standard headers include: security, audit trail, transaction limits, pci compliance
        // None are present in 'Standard basic description without specific headers.'
        expect(capturedData.missingSections).toContain('Missing section: "SECURITY" configurations not explicitly detailed.');
        expect(capturedData.missingSections).toContain('Missing section: "AUDIT TRAIL" configurations not explicitly detailed.');
        expect(capturedData.missingSections).toContain('Missing section: "TRANSACTION LIMITS" configurations not explicitly detailed.');
        expect(capturedData.missingSections).toContain('Missing section: "PCI COMPLIANCE" configurations not explicitly detailed.');
    });
    test('Conflict alerts are triggered for insecure protocol in Fintech requirements', async () => {
        const mockCurrent = {
            _id: 'req1',
            title: 'Insecure Flow',
            description: 'The API uses http://insecure-endpoint.com for transfer operations.',
            category: 'Fintech',
            project: 'Project Alpha'
        };
        Requirement_1.Requirement.findById.mockResolvedValue(mockCurrent);
        Requirement_1.Requirement.find.mockResolvedValue([]);
        CoverageService_1.CoverageService.calculateCoverage.mockResolvedValue(100);
        const mockSave = jest.fn().mockResolvedValue(true);
        let capturedData = null;
        ValidationResult_1.ValidationResult.mockImplementation((data) => {
            capturedData = data;
            return { save: mockSave };
        });
        ValidationResult_1.ValidationResult.updateMany.mockResolvedValue({});
        Report_1.Report.updateMany.mockResolvedValue({});
        await ComparativeValidationService_1.ComparativeValidationService.runValidation('req1');
        expect(capturedData.conflictAlerts).toContain('Security Conflict: Non-secure protocol http:// specified for a Fintech category requirement.');
    });
});
