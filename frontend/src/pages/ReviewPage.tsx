import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { reviewService } from '../services/reviews';
import { mistakeService } from '../services/mistakes';
import { FileText, ClipboardList, CheckCircle2, XCircle, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';

// Markdown table parser and renderer
const AiAnalysisRenderer: React.FC<{ analysis: string }> = ({ analysis }) => {
  const parseTable = (markdown: string) => {
    const lines = markdown.split('\n').filter(line => line.trim());
    const tableStart = lines.findIndex(line => line.includes('|'));
    
    if (tableStart === -1) {
      return { headers: [], rows: [], text: markdown };
    }

    const tableEndIndex = lines.findLastIndex(line => line.includes('|'));
    
    const tableLines = lines.slice(tableStart, tableEndIndex + 1);
    const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
    const rows = tableLines.slice(2)
      .filter(line => line.includes('|'))
      .map(line => line.split('|').map(c => c.trim()).filter(c => c));

    const text = lines.slice(0, tableStart).join('\n');
    const postText = lines.slice(tableEndIndex + 1).join('\n');
    return { headers, rows, text, postText };
  };

  const { headers, rows, text, postText } = parseTable(analysis);

  const getSeverity = (cell: string) => {
    if (cell.includes('Critical') || cell.includes('ERROR')) return 'critical';
    if (cell.includes('MISSING') || cell.includes('REQUIRED')) return 'warning';
    if (cell.includes('Recommend')) return 'info';
    return 'normal';
  };

  const severityStyle = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-2">
      {text.trim() && (
        <p className="text-[9px] text-slate-600 leading-relaxed bg-white border border-slate-200 rounded p-1.5">
          {text.replace(/\*\*/g, '').replace(/#+\s*/g, '').trim()}
        </p>
      )}
      
      {rows.length > 0 && (
        <div className="overflow-x-auto bg-white border border-slate-200 rounded text-[10px]">
          <table className="w-full">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-bold text-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, ci) => {
                    const severity = ci === row.length - 1 ? getSeverity(cell) : 'normal';
                    return (
                      <td key={ci} className={`px-3 py-2 border-b border-slate-100 ${severity !== 'normal' ? severityStyle(severity) + ' border font-medium' : 'text-slate-600'}`}>
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {postText.trim() && (
        <div className="text-[10px] text-slate-700 leading-relaxed bg-white border border-slate-200 rounded p-2.5 mt-2 space-y-2">
          {postText.split(/\n+/).filter(p => p.trim()).map((paragraph, idx) => {
            let cleanParagraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            cleanParagraph = cleanParagraph.replace(/^#+\s*/g, '<strong>').replace(/(<strong>.*?)$/g, '$1</strong>'); // bold headings
            return <p key={idx} dangerouslySetInnerHTML={{ __html: cleanParagraph }} />
          })}
        </div>
      )}
    </div>
  );
};

export const ReviewPage: React.FC = () => {
  const { requirements, fetchRequirements, currentRequirement, fetchRequirement, currentReport, fetchReport } = useStore();
  const [activeReqId, setActiveReqId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Mistake states
  const [isMistake, setIsMistake] = useState(false);
  const [mistakeType, setMistakeType] = useState('Ambiguous Flow');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  // AI Validation states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Requirements that are UNDER_REVIEW
  const reviewReqs = requirements.filter((r) => r.status === 'UNDER_REVIEW');

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const handleSelectReq = async (id: string) => {
    if (!id) return;
    setActiveReqId(id);
    setAiAnalysis(null);
    setAiError(null);
    await fetchRequirement(id);
    await fetchReport(id);
  };

  const handleAiValidation = async () => {
    if (!currentReport) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const aiResult = await reviewService.runComparativeAnalysis(currentReport._id);
      setAiAnalysis(aiResult);
    } catch (err: any) {
      setAiError(err.message || 'AI Validation failed.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDecision = async (action: 'APPROVE' | 'REJECT' | 'SEND_TO_CLIENT') => {
    if (!currentReport || !currentRequirement) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (action === 'REJECT' && isMistake) {
        const qaId = typeof currentReport.qa === 'object' && currentReport.qa ? currentReport.qa._id : currentReport.qa;
        if (!qaId) throw new Error('Could not identify QA user associated with this report.');
        await mistakeService.logMistake({
          qaId: qaId.toString(),
          requirementId: currentRequirement._id,
          mistakeType,
          severity
        });
      }

      await reviewService.reviewReport({
        reportId: currentReport._id,
        action,
        feedback: feedback.trim() || undefined
      });
      // Clear current selection and reload
      setActiveReqId('');
      setFeedback('');
      setIsMistake(false);
      fetchRequirements();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Selector header */}
      <div className="bg-white border border-slate-200 p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reports Awaiting Review</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Select a QA analysis report submission to review findings and approve for client review.</p>
        </div>

        <div className="w-full md:w-80">
          <select
            value={activeReqId}
            onChange={(e) => handleSelectReq(e.target.value)}
            className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
          >
            <option value="">Select Report to Review...</option>
            {reviewReqs.map((r) => (
              <option key={r._id} value={r._id}>
                {r.title} ({r.project})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentRequirement && currentReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-in">
          {/* Column 1: Requirement Specs */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded p-6 flex flex-col h-[650px] overflow-hidden">
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

          {/* Column 2: QA Report Details */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded p-6 flex flex-col h-[650px] overflow-hidden text-xs">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText size={14} className="text-slate-600" />
                <span>QA Analysis Findings</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Submitted by: {currentReport.qa && typeof currentReport.qa === 'object' ? currentReport.qa.name : 'QA User'}</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Findings Summary</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{currentReport.summary}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Manual Missing Features</h4>
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
                <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Identified Risks</h4>
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
                  <h4 className="font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Comments</h4>
                  <p className="text-slate-500 italic leading-relaxed">{currentReport.comments}</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Decision & Feedback */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded p-6 flex flex-col h-[650px] overflow-hidden text-xs">
            <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <ClipboardList size={14} className="text-slate-600" />
                <span>Admin Review Actions</span>
              </h3>
              {!aiAnalysis && !isAiLoading && (
                <button
                  onClick={handleAiValidation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-2.5 py-1 text-[10px] font-semibold tracking-wider transition-all duration-150 flex items-center space-x-1"
                >
                  <Sparkles size={12} />
                  <span>AI VALIDATE</span>
                </button>
              )}
            </div>

            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-2.5 rounded font-medium">
                {submitError}
              </div>
            )}

            <div className="flex-1 flex flex-col justify-between overflow-y-auto pr-2">
              <div className="space-y-4">
                {/* AI Results Section */}
                {isAiLoading ? (
                  <div className="bg-indigo-50 border border-indigo-100 rounded p-4 flex flex-col items-center justify-center space-y-2 text-indigo-600 scale-in">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gemini AI is analyzing...</span>
                  </div>
                ) : aiAnalysis ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded p-3 scale-in space-y-2.5">
                    <div className="flex items-center space-x-1.5">
                      <Sparkles size={12} className="text-indigo-600" />
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">AI Analysis Result</span>
                    </div>
                     
                    {/* Recommendation Badge - Prominent */}
                    <div className={`rounded p-2 border text-center text-[9px] font-bold uppercase tracking-wider ${
                      aiAnalysis.recommendation === 'APPROVE' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                      aiAnalysis.recommendation === 'SEND_TO_CLIENT' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                      'bg-red-100 border-red-300 text-red-800'
                    }`}>
                      ▸ {aiAnalysis.recommendation}
                    </div>

                    {/* Compact Analysis Table */}
                    <AiAnalysisRenderer analysis={aiAnalysis.highlightedResult} />
                  </div>
                ) : aiError ? (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-2.5 rounded font-medium text-[10px]">
                    {aiError}
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Reviewer Notes / Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
                    placeholder="Provide feedback on the manual analysis report, detailing instructions for re-validation if rejecting."
                  />
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMistake}
                      onChange={(e) => setIsMistake(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log as QA Mistake</span>
                  </label>

                  {isMistake && (
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded border border-slate-150 scale-in">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Mistake Type</label>
                        <select
                          value={mistakeType}
                          onChange={(e) => setMistakeType(e.target.value)}
                          className="w-full border border-slate-200 rounded p-1 text-[11px] bg-white"
                        >
                          <option value="Ambiguous Flow">Ambiguous Flow</option>
                          <option value="Boundary Edge Case Missing">Boundary Edge Case Missing</option>
                          <option value="Checklist Accuracy Fail">Checklist Accuracy Fail</option>
                          <option value="Insecure Implementation Detail">Insecure Implementation Detail</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Severity</label>
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value as any)}
                          className="w-full border border-slate-200 rounded p-1 text-[11px] bg-white"
                        >
                          <option value="LOW">LOW (1 Point)</option>
                          <option value="MEDIUM">MEDIUM (3 Points)</option>
                          <option value="HIGH">HIGH (5 Points)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => handleDecision('APPROVE')}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-2 font-semibold flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>APPROVE</span>
                </button>
                <button
                  onClick={() => handleDecision('REJECT')}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded py-2 font-semibold flex items-center justify-center space-x-1.5"
                >
                  <XCircle size={14} />
                  <span>REJECT</span>
                </button>
                <button
                  onClick={() => handleDecision('SEND_TO_CLIENT')}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded py-2 font-semibold flex items-center justify-center space-x-1.5"
                >
                  <Sparkles size={14} />
                  <span>SEND TO CLIENT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeReqId ? (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-red-500 flex flex-col items-center justify-center space-y-2">
          <AlertTriangle size={48} strokeWidth={1.5} />
          <p className="text-xs font-medium">Critical Error: QA Report data is missing or corrupted for this requirement.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <AlertTriangle size={48} strokeWidth={1.5} />
          <p className="text-xs font-medium">Select a requirement from the dropdown above to review its QA report.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
