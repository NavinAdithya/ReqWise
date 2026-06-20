import { AssessmentService } from '../services/AssessmentService';
import { Mistake } from '../models/Mistake';
import { Assessment } from '../models/Assessment';

jest.mock('../models/Mistake');
jest.mock('../models/Assessment');
jest.mock('../services/NotificationService');

describe('QA Performance Assessment Engine Triggers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Single mistake is ignored and does not trigger an assessment', async () => {
    const mockMistakes = [
      {
        _id: 'm1',
        qa: 'qa1',
        project: 'Project A',
        category: 'Fintech',
        mistakeType: 'Ambiguous Requirement',
        severity: 'HIGH', // Weight = 5
        createdAt: new Date()
      }
    ];

    (Mistake.find as jest.Mock).mockResolvedValue(mockMistakes);

    const assessment = await AssessmentService.evaluateMistakesAndTriggerAssessment('qa1');
    expect(assessment).toBeNull();
    expect(Assessment.prototype.save).not.toHaveBeenCalled();
  });

  test('Same mistake 2+ times in the same project triggers assessment if weight >= 10', async () => {
    // 2 high severity mistakes of same type in same project -> weight = 10
    const mockMistakes = [
      {
        _id: 'm1',
        qa: 'qa1',
        project: 'Project A',
        category: 'Fintech',
        mistakeType: 'Missing Validation',
        severity: 'HIGH', // Weight = 5
        createdAt: new Date()
      },
      {
        _id: 'm2',
        qa: 'qa1',
        project: 'Project A',
        category: 'Fintech',
        mistakeType: 'Missing Validation',
        severity: 'HIGH', // Weight = 5
        createdAt: new Date()
      }
    ];

    (Mistake.find as jest.Mock).mockResolvedValue(mockMistakes);
    (Assessment.findOne as jest.Mock).mockResolvedValue(null);
    
    const mockSave = jest.fn().mockResolvedValue({ _id: 'assessment1' });
    (Assessment as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave
    }));

    await AssessmentService.evaluateMistakesAndTriggerAssessment('qa1');
    expect(mockSave).toHaveBeenCalled();
  });

  test('Same mistake in 3+ projects of same category triggers assessment if weight >= 10', async () => {
    // Same mistake type in 3 different projects, all MEDIUM -> 3 * 3 = 9 (does not trigger < 10)
    // Same mistake type in 4 different projects, all MEDIUM -> 4 * 3 = 12 (triggers >= 10)
    const mockMistakes = [
      {
        _id: 'm1',
        qa: 'qa1',
        project: 'Project A',
        category: 'Fintech',
        mistakeType: 'Ambiguous Flow',
        severity: 'MEDIUM', // Weight = 3
        createdAt: new Date()
      },
      {
        _id: 'm2',
        qa: 'qa1',
        project: 'Project B',
        category: 'Fintech',
        mistakeType: 'Ambiguous Flow',
        severity: 'MEDIUM', // Weight = 3
        createdAt: new Date()
      },
      {
        _id: 'm3',
        qa: 'qa1',
        project: 'Project C',
        category: 'Fintech',
        mistakeType: 'Ambiguous Flow',
        severity: 'MEDIUM', // Weight = 3
        createdAt: new Date()
      },
      {
        _id: 'm4',
        qa: 'qa1',
        project: 'Project D',
        category: 'Fintech',
        mistakeType: 'Ambiguous Flow',
        severity: 'MEDIUM', // Weight = 3
        createdAt: new Date()
      }
    ];

    (Mistake.find as jest.Mock).mockResolvedValue(mockMistakes);
    (Assessment.findOne as jest.Mock).mockResolvedValue(null);
    
    const mockSave = jest.fn().mockResolvedValue({ _id: 'assessment2' });
    (Assessment as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave
    }));

    await AssessmentService.evaluateMistakesAndTriggerAssessment('qa1');
    expect(mockSave).toHaveBeenCalled();
  });
});
