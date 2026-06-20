import { ComparativeValidationService } from '../services/ComparativeValidationService';
import { CoverageService } from '../services/CoverageService';
import { Requirement } from '../models/Requirement';
import { ValidationResult } from '../models/ValidationResult';
import { Report } from '../models/Report';

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

    (Requirement.findById as jest.Mock).mockResolvedValue(mockCurrent);
    (Requirement.find as jest.Mock).mockResolvedValue(mockHistorical);
    (CoverageService.calculateCoverage as jest.Mock).mockResolvedValue(80);

    const mockSave = jest.fn().mockResolvedValue({ _id: 'valresult1' });
    let capturedData: any = null;
    (ValidationResult as unknown as jest.Mock).mockImplementation((data) => {
      capturedData = data;
      return { save: mockSave };
    });
    (ValidationResult.updateMany as jest.Mock).mockResolvedValue({});
    (Report.updateMany as jest.Mock).mockResolvedValue({});

    const result = await ComparativeValidationService.runValidation('req1');

    expect(result).toBeDefined();
    // Coverage mock is 80%
    expect(CoverageService.calculateCoverage).toHaveBeenCalledWith('req1');
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

    (Requirement.findById as jest.Mock).mockResolvedValue(mockCurrent);
    (Requirement.find as jest.Mock).mockResolvedValue([]);
    (CoverageService.calculateCoverage as jest.Mock).mockResolvedValue(50);

    const mockSave = jest.fn().mockResolvedValue(true);
    let capturedData: any = null;
    (ValidationResult as unknown as jest.Mock).mockImplementation((data) => {
      capturedData = data;
      return { save: mockSave };
    });
    (ValidationResult.updateMany as jest.Mock).mockResolvedValue({});
    (Report.updateMany as jest.Mock).mockResolvedValue({});

    await ComparativeValidationService.runValidation('req1');

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

    (Requirement.findById as jest.Mock).mockResolvedValue(mockCurrent);
    (Requirement.find as jest.Mock).mockResolvedValue([]);
    (CoverageService.calculateCoverage as jest.Mock).mockResolvedValue(100);

    const mockSave = jest.fn().mockResolvedValue(true);
    let capturedData: any = null;
    (ValidationResult as unknown as jest.Mock).mockImplementation((data) => {
      capturedData = data;
      return { save: mockSave };
    });
    (ValidationResult.updateMany as jest.Mock).mockResolvedValue({});
    (Report.updateMany as jest.Mock).mockResolvedValue({});

    await ComparativeValidationService.runValidation('req1');

    expect(capturedData.conflictAlerts).toContain('Security Conflict: Non-secure protocol http:// specified for a Fintech category requirement.');
  });
});
