import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { reviewService } from '../services/reviews';
import { reportService } from '../services/reports';
import { 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  Edit3, 
  Play,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import type { ValidationResult } from '../types';


export const ClientReviewPage: React.FC = () => {
  const { requirements, fetchRequirements, currentRequirement, fetchRequirement, currentReport, fetchReport } = useStore();
  
  const [activeReqId, setActiveReqId] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client Decision tabs: 'ACCEPT' | 'REJECT' | 'MODIFY'
  const [decisionTab, setDecisionTab] = useState<'ACCEPT' | 'REJECT' | 'MODIFY'>('ACCEPT');
  
  // Reject sub-options
  const [rejectType, setRejectType] = useState<'REJECT_KEEP_ORIGINAL' | 'REJECT_RECOMMENDATION'>('REJECT_RECOMMENDATION');

  // Modify sub-options fields
  const [modifiedTitle, setModifiedTitle] = useState('');
  const [modifiedDescription, setModifiedDescription] = useState('');
  const [quickValidationResult, setQuickValidationResult] = useState<ValidationResult | null>(null);
  const [runningQuickValidation, setRunningQuickValidation] = useState(false);

  // Filter client review items
  const clientReviewReqs = requirements.filter((r) => r.status === 'CLIENT_REVIEW');

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleSelectReq = async (id: string) => {
    if (!id) return;
    setActiveReqId(id);
    await fetchRequirement(id);
    await fetchReport(id);
    
    // Pre-populate modification fields
    const req = useStore.getState().currentRequirement;
    if (req) {
      setModifiedTitle(req.title);
      setModifiedDescription(req.description);
      setQuickValidationResult(null);
    }
  };

  const handleAccept = async () => {
    if (!currentRequirement) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await reviewService.clientDecision({
        requirementId: currentRequirement._id,
        decision: 'ACCEPT',
        comments: comments.trim() || undefined
      });
      setActiveReqId('');
      fetchRequirements();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept requirement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentRequirement) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await reviewService.clientDecision({
        requirementId: currentRequirement._id,
        decision: rejectType,
        comments: comments.trim() || undefined
      });
      setActiveReqId('');
      fetchRequirements();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit rejection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunQuickValidation = async () => {
    if (!currentRequirement) return;
    setRunningQuickValidation(true);
    try {
      const { validationResult } = await reportService.runValidation(currentRequirement._id, {
        summary: currentReport?.summary || '',
        missingFeatures: currentReport?.missingFeatures || [],
        risks: currentReport?.risks || []
      }, modifiedDescription);
      setQuickValidationResult(validationResult);
    } catch (err) {
      console.error(err);
    } finally {
      setRunningQuickValidation(false);
    }
  };

  const handleModifySubmit = async (decision: 'MODIFY_VERSION' | 'MODIFY_FINALIZE') => {
    if (!currentRequirement) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await reviewService.clientDecision({
        requirementId: currentRequirement._id,
        decision,
        comments: comments.trim() || undefined,
        modifiedTitle: modifiedTitle.trim(),
        modifiedDescription: modifiedDescription.trim()
      });
      setActiveReqId('');
      fetchRequirements();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply modifications.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Selector */}
      <div className="bg-white border border-slate-200 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Awaiting Client Finalization</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Select a requirement with complete QA reports to make your accept, reject, or modify decisions.</p>
        </div>

        <div className="w-full md:w-80">
          <select
            value={activeReqId}
            onChange={(e) => handleSelectReq(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
          >
            <option value="">Select Requirement...</option>
            {clientReviewReqs.map((r) => (
              <option key={r._id} value={r._id}>
                {r.title} ({r.project})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeReqId && currentRequirement && currentReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 scale-in text-xs">
          {/* Column 1: Requirement Detail */}
          <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[480px] overflow-hidden">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{currentRequirement.category}</span>
              <h3 className="text-xs font-bold text-slate-800 uppercase mt-1 truncate">{currentRequirement.title}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Project: {currentRequirement.project} | Version: v{currentRequirement.version}</p>
            </div>
            <div className="flex-1 overflow-y-auto text-slate-600 leading-relaxed pr-2">
              <h4 className="font-bold text-slate-800 text-[10px] uppercase mb-2">Requirement Specifications</h4>
              <p className="whitespace-pre-wrap">{currentRequirement.description}</p>
            </div>
          </div>

          {/* Column 2: QA Findings Report */}
          <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[480px] overflow-hidden">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText size={14} className="text-slate-600" />
                <span>QA Analysis Findings</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">QA Report Summary</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{currentReport.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Report Missing Features</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentReport.missingFeatures.length === 0 ? (
                    <span className="text-slate-400 italic text-[10px]">None identified.</span>
                  ) : (
                    currentReport.missingFeatures.map((f, i) => (
                      <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {f}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Report Risks</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentReport.risks.length === 0 ? (
                    <span className="text-slate-400 italic text-[10px]">None identified.</span>
                  ) : (
                    currentReport.risks.map((r, i) => (
                      <span key={i} className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                        {r}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {currentReport.comments && (
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Report Remarks</h4>
                  <p className="text-slate-500 italic leading-relaxed">{currentReport.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Client Decision Options */}
          <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[480px] overflow-hidden">
            {/* Decision Tabs */}
            <div className="flex border-b border-slate-100 pb-3 mb-4">
              <button
                onClick={() => setDecisionTab('ACCEPT')}
                className={`flex-1 py-1 text-center font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  decisionTab === 'ACCEPT' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ThumbsUp size={12} />
                <span>ACCEPT</span>
              </button>
              <button
                onClick={() => setDecisionTab('REJECT')}
                className={`flex-1 py-1 text-center font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  decisionTab === 'REJECT' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ThumbsDown size={12} />
                <span>REJECT</span>
              </button>
              <button
                onClick={() => setDecisionTab('MODIFY')}
                className={`flex-1 py-1 text-center font-bold text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 ${
                  decisionTab === 'MODIFY' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 size={12} />
                <span>MODIFY</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-2 rounded font-medium">
                {errorMsg}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              
              {/* ACCEPT CONTENT */}
              {decisionTab === 'ACCEPT' && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-slate-500 leading-relaxed">Accepting this requirement will apply all validation details and finalize it in version v{currentRequirement.version}.</p>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Acceptance Comments</label>
                      <textarea
                        rows={4}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 focus:outline-none focus:border-brand-500"
                        placeholder="Add comments or instructions..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAccept}
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 font-semibold tracking-wider transition-all duration-150"
                  >
                    {submitting ? 'Finalizing...' : 'ACCEPT & FINALIZE'}
                  </button>
                </div>
              )}

              {/* REJECT CONTENT */}
              {decisionTab === 'REJECT' && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rejection Type</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer p-2 border border-slate-100 rounded">
                        <input
                          type="radio"
                          name="rejectType"
                          checked={rejectType === 'REJECT_KEEP_ORIGINAL'}
                          onChange={() => setRejectType('REJECT_KEEP_ORIGINAL')}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">Keep Original Version</p>
                          <p className="text-[10px] text-slate-400">Revert changes and keep original requirements content.</p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer p-2 border border-slate-100 rounded">
                        <input
                          type="radio"
                          name="rejectType"
                          checked={rejectType === 'REJECT_RECOMMENDATION'}
                          onChange={() => setRejectType('REJECT_RECOMMENDATION')}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">Reject Findings & Revalidate</p>
                          <p className="text-[10px] text-slate-400">Revert to Revalidation state. QA must redo validation.</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rejection Comments</label>
                      <textarea
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2 focus:outline-none focus:border-brand-500"
                        placeholder="Detail reasoning for rejecting..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleReject}
                    disabled={submitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white rounded py-2 font-semibold tracking-wider transition-all duration-150"
                  >
                    {submitting ? 'Submitting rejection...' : 'SUBMIT REJECTION'}
                  </button>
                </div>
              )}

              {/* MODIFY CONTENT */}
              {decisionTab === 'MODIFY' && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Modified Title</label>
                      <input
                        type="text"
                        value={modifiedTitle}
                        onChange={(e) => setModifiedTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Modified Description</label>
                      <textarea
                        rows={3}
                        value={modifiedDescription}
                        onChange={(e) => setModifiedDescription(e.target.value)}
                        className="w-full border border-slate-200 rounded p-2"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Quick Validation Check</span>
                        <button
                          type="button"
                          onClick={handleRunQuickValidation}
                          disabled={runningQuickValidation}
                          className="text-brand-600 hover:text-brand-700 font-bold flex items-center space-x-1"
                        >
                          <Play size={10} />
                          <span>{runningQuickValidation ? 'Running...' : 'Run Validate'}</span>
                        </button>
                      </div>

                      {quickValidationResult ? (
                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded space-y-2 text-[10px]">
                          <div className="flex justify-between">
                            <span>Checklist Coverage: <strong>{quickValidationResult.checklistCoverage}%</strong></span>
                            <span>Similarity: <strong>{quickValidationResult.similarity}%</strong></span>
                          </div>
                          {quickValidationResult.conflictAlerts.length > 0 && (
                            <div className="text-red-600 font-medium">
                              ⚠ {quickValidationResult.conflictAlerts[0]}
                            </div>
                          )}
                          {quickValidationResult.conflictAlerts.length === 0 && (
                            <div className="text-emerald-600 font-medium flex items-center space-x-1">
                              <CheckCircle size={10} />
                              <span>No conflicts detected in modified text.</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">Run validation to review similarity and alerts on edits.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleModifySubmit('MODIFY_VERSION')}
                      disabled={submitting}
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded py-2 font-semibold text-[10px] tracking-wider transition-all duration-150"
                    >
                      VERSION & RE-QA
                    </button>
                    <button
                      onClick={() => handleModifySubmit('MODIFY_FINALIZE')}
                      disabled={submitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 font-semibold text-[10px] tracking-wider transition-all duration-150"
                    >
                      APPLY & FINALIZE
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <HelpCircle size={48} strokeWidth={1.5} />
          <p className="text-xs font-medium">Select a requirement from the dropdown above to resolve client reviews.</p>
        </div>
      )}
    </div>
  );
};

export default ClientReviewPage;
