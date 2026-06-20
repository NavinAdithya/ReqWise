import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { requirementService } from '../services/requirements';
import {
  CheckSquare, 
  CheckCircle2,
  Plus,
  X,
  FileText
} from 'lucide-react';

export const QAWorkspacePage: React.FC = () => {
  const { 
    requirements, 
    fetchRequirements, 
    currentRequirement, 
    fetchRequirement, 
    currentReport, 
    draftReport, 
    submitReport, 
    fetchReport
  } = useStore();

  const [checklist, setChecklist] = useState<any>(null);
  
  // Manual Report Draft States
  const [summary, setSummary] = useState('');
  const [comments, setComments] = useState('');
  const [missingFeatures, setMissingFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [risks, setRisks] = useState<string[]>([]);
  const [newRiskInput, setNewRiskInput] = useState('');
  
  const [activeReqId, setActiveReqId] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [finalSubmitSuccess, setFinalSubmitSuccess] = useState(false);

  const handleLoadSampleData = () => {
    if (!currentRequirement) return;
    
    if (currentRequirement.category === 'Fintech') {
      setSummary('Completed Fintech audit review. Identified missing transaction security and encryption compliance details.');
      setMissingFeatures([
        'Audit logging for transaction exceptions',
        'TLS 1.3 encryption configurations'
      ]);
      setRisks([
        'Race conditions during concurrent refund processing',
        'Information disclosure in database error logs'
      ]);
      setComments('Checklist items verified. Follow up required on compliance rules.');
    } else if (currentRequirement.category === 'Healthcare') {
      setSummary('Conducted HIPAA privacy review. Insufficient access control configuration details detected.');
      setMissingFeatures([
        'Audit trail for patient record accesses',
        'Multi-factor authentication check for doctors'
      ]);
      setRisks([
        'Unauthorized access to patient health records',
        'Stale session tokens on shared terminal devices'
      ]);
      setComments('HIPAA logs need explicit review.');
    } else {
      setSummary('Standard QA audit conducted on requirement. Basic functional flow verified.');
      setMissingFeatures([
        'Roles and permissions documentation',
        'Input validation for special characters'
      ]);
      setRisks([
        'Denial of service via memory exhaustion on large file uploads',
        'SQL injection vulnerability on unsanitized search input'
      ]);
      setComments('Initial check complete. Recommended for regression testing.');
    }
  };

  // Filter assigned requirements for QA
  const assignedRequirements = requirements.filter(
    (r) => r.status === 'ASSIGNED' || r.status === 'UNDER_ANALYSIS' || r.status === 'REVALIDATION'
  );

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  // Load active requirement checklist and report
  const handleSelectRequirement = async (id: string) => {
    if (!id) return;
    setActiveReqId(id);
    await fetchRequirement(id);
    await fetchReport(id);
    
    // Get checklist
    const { checklist: checklistData } = await requirementService.getChecklist(id);
    setChecklist(checklistData);
  };

  // Sync report data once loaded
  useEffect(() => {
    if (currentReport) {
      setSummary(currentReport.summary || '');
      setComments(currentReport.comments || '');
      setMissingFeatures(currentReport.missingFeatures || []);
      setRisks(currentReport.risks || []);
    } else {
      setSummary('');
      setComments('');
      setMissingFeatures([]);
      setRisks([]);
    }
  }, [currentReport]);

  const handleChecklistResult = (index: number, result: 'Pass' | 'Fail' | 'N/S') => {
    if (!checklist) return;
    const items = [...checklist.items];
    items[index].result = result;
    setChecklist({ ...checklist, items });
  };

  const handleSaveChecklist = async () => {
    if (!checklist || !currentRequirement) return;
    try {
      await requirementService.updateChecklist(currentRequirement._id, checklist.items);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };



  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setMissingFeatures([...missingFeatures, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setMissingFeatures(missingFeatures.filter((_, i) => i !== index));
  };

  const handleAddRisk = () => {
    if (!newRiskInput.trim()) return;
    setRisks([...risks, newRiskInput.trim()]);
    setNewRiskInput('');
  };

  const handleRemoveRisk = (index: number) => {
    setRisks(risks.filter((_, i) => i !== index));
  };

  const handleDraftSubmit = async () => {
    if (!currentRequirement) return;
    try {
      await draftReport({
        requirementId: currentRequirement._id,
        summary,
        missingFeatures,
        risks,
        comments
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalSubmit = async () => {
    if (!currentRequirement) return;
    try {
      await draftReport({
        requirementId: currentRequirement._id,
        summary,
        missingFeatures,
        risks,
        comments
      });
      const updatedReport = useStore.getState().currentReport;
      if (!updatedReport) return;
      await submitReport(updatedReport._id);
      
      setFinalSubmitSuccess(true);
      setTimeout(() => {
        setFinalSubmitSuccess(false);
        setActiveReqId('');
      }, 3000);
      
      fetchRequirements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-white border border-slate-200 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">QA Workspace Board</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Select an assigned requirement to conduct your manual validation checks.</p>
        </div>

        <div className="w-full md:w-80">
          <select
            value={activeReqId}
            onChange={(e) => handleSelectRequirement(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
          >
            <option value="">Select Requirement to Analyze...</option>
            {assignedRequirements.map((r) => (
              <option key={r._id} value={r._id}>
                {r.title} ({r.project})
              </option>
            ))}
          </select>
        </div>
      </div>

      {finalSubmitSuccess ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-emerald-500 flex flex-col items-center justify-center space-y-4 scale-in">
          <CheckCircle2 size={48} strokeWidth={1.5} />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Report Submitted Successfully!</h3>
            <p className="text-xs font-medium text-slate-500">The QA report has been sent to the Admin for review.</p>
          </div>
        </div>
      ) : currentRequirement ? (
        <div className="space-y-6 scale-in">
          {/* 3 Column Top Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Requirement Detail */}
            <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[400px] overflow-hidden lg:col-span-6">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{currentRequirement.category}</span>
                <h3 className="text-xs font-bold text-slate-800 uppercase mt-1 truncate">{currentRequirement.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1">Project: {currentRequirement.project} | Version: v{currentRequirement.version}</p>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 leading-relaxed pr-2">
                <h4 className="font-bold text-slate-800 text-[10px] uppercase mb-2">Requirement Specifications</h4>
                <p className="whitespace-pre-wrap">{currentRequirement.description}</p>
              </div>
            </div>

            {/* Column 2: Checklist */}
            <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[400px] overflow-hidden lg:col-span-6">
              <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckSquare size={14} className="text-slate-600" />
                  <span>Quality Checklist</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 pb-4">
                {checklist?.items?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-12 text-center">No checklist items generated.</p>
                ) : (
                  <div className="space-y-3">
                    {checklist?.items?.map((item: any, index: number) => (
                      <div key={index} className="flex flex-col space-y-2 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <span className="text-xs font-semibold text-slate-700">{item.text}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleChecklistResult(index, 'Pass')}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition-colors ${
                              item.result === 'Pass' 
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            ✓ Pass
                          </button>
                          <button
                            onClick={() => handleChecklistResult(index, 'Fail')}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition-colors ${
                              item.result === 'Fail' 
                                ? 'bg-red-50 border-red-500 text-red-700' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            X Fail
                          </button>
                          <button
                            onClick={() => handleChecklistResult(index, 'N/S')}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold border transition-colors ${
                              item.result === 'N/S' 
                                ? 'bg-amber-50 border-amber-500 text-amber-700' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            ? N/S
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-auto pt-3 flex flex-col space-y-3">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium px-1">
                  <span>Pass = 1pt</span>
                  <span>Not Sure = 0.5pt</span>
                  <span>Fail = 0pt</span>
                </div>
                {checklist && (
                  <button
                    onClick={handleSaveChecklist}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-150"
                  >
                    Save Progress
                  </button>
                )}
              </div>
            </div>


          </div>

          {/* Bottom Manual Report Editor */}
          <div className="bg-white border border-slate-200 rounded p-6">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Write Analysis Findings Report (Human Decides)
              </h3>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider border border-brand-200 hover:border-brand-300 rounded px-2.5 py-1 transition-colors"
              >
                Load Sample Data
              </button>
            </div>
            
            {saveSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2 rounded text-xs font-semibold">
                Draft saved successfully.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Report Summary (Detail your findings manually)
                </label>
                <textarea
                  required
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                  placeholder="Provide a summary of the requirement validation findings..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Features List */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Missing Features List
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      placeholder="e.g. Audit Trail logging header"
                      className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded px-3 py-1.5 text-xs font-semibold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {missingFeatures.length === 0 && <span className="text-xs text-slate-400 italic">No missing features added yet.</span>}
                    {missingFeatures.map((feat, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 rounded px-2 py-0.5 text-[10px] font-medium flex items-center space-x-1.5">
                        <span>{feat}</span>
                        <button type="button" onClick={() => handleRemoveFeature(idx)} className="hover:text-red-600">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risks List */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Identified Risks List
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newRiskInput}
                      onChange={(e) => setNewRiskInput(e.target.value)}
                      placeholder="e.g. webhook race condition"
                      className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddRisk}
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded px-3 py-1.5 text-xs font-semibold"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {risks.length === 0 && <span className="text-xs text-slate-400 italic">No risks identified.</span>}
                    {risks.map((risk, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 rounded px-2 py-0.5 text-[10px] font-medium flex items-center space-x-1.5">
                        <span>{risk}</span>
                        <button type="button" onClick={() => handleRemoveRisk(idx)} className="hover:text-red-600">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  General Comments (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                  placeholder="Additional clarifications, annotations or feedback..."
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleDraftSubmit}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 rounded px-4 py-2 text-xs font-semibold"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={!summary.trim()}
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded px-4 py-2 text-xs font-semibold disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Submit Final Report
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <FileText size={48} strokeWidth={1.5} />
          <p className="text-xs font-medium">Select an assigned requirement from the list above to begin analysis.</p>
        </div>
      )}
    </div>
  );
};

export default QAWorkspacePage;
