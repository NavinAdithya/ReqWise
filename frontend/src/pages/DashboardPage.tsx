import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { assessmentService } from '../services/assessments';
import type { Assessment, Requirement } from '../types';
import { RequirementDetailsModal } from '../components/RequirementDetailsModal';

export const DashboardPage: React.FC = () => {
  const { user, requirements, fetchRequirements, fetchNotifications } = useStore();
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [assessmentSuccess, setAssessmentSuccess] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedDecisionReq, setSelectedDecisionReq] = useState<Requirement | null>(null);

  useEffect(() => {
    fetchRequirements();
    fetchNotifications();
    
    // If user is QA, fetch their active assessments
    if (user?.role === 'QA') {
      assessmentService.getAssessmentsByQA(user._id).then(({ assessments }) => {
        const pending = assessments.find(a => a.status === 'PENDING');
        if (pending) {
          setActiveAssessment(pending);
          setAnswers(pending.questions.map(() => ''));
        }
      });
    }
  }, [fetchRequirements, fetchNotifications, user]);

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment) return;
    setSubmittingAssessment(true);
    try {
      await assessmentService.submitAnswers(activeAssessment._id, answers);
      setAssessmentSuccess(true);
      setTimeout(() => {
        setActiveAssessment(null);
        setAssessmentSuccess(false);
        setShowAssessmentModal(false);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAssessment(false);
    }
  };

  if (user?.role === 'ADMIN') {
    const total = requirements.length;
    const pendingReview = requirements.filter((r) => r.status === 'UNDER_REVIEW').length;
    const clientReview = requirements.filter((r) => r.status === 'CLIENT_REVIEW').length;
    const finalized = requirements.filter((r) => r.status === 'FINALIZED').length;

    return (
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Projects</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{total}</h3>
            </div>
            <div className="mt-4 h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-inner">
              <FileText size={18} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Reviews</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{pendingReview}</h3>
            </div>
            <div className="mt-4 h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shadow-inner">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">In Client Decision</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{clientReview}</h3>
            </div>
            <div className="mt-4 h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finalized Requirements</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{finalized}</h3>
            </div>
            <div className="mt-4 h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Pending Admin Reviews</h3>
            <div className="space-y-3">
              {requirements.filter(r => r.status === 'UNDER_REVIEW').length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No reports pending review.</p>
              ) : (
                requirements.filter(r => r.status === 'UNDER_REVIEW').map(r => (
                  <div key={r._id} className="flex items-center justify-between p-3 border border-slate-100 rounded text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{r.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Project: {r.project} | QA: {r.assignedQA?.name || 'Unassigned'}</p>
                    </div>
                    <Link to="/review" className="text-brand-600 hover:text-brand-700 flex items-center space-x-1 font-semibold">
                      <span>Review</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Recent Client Decisions</h3>
            <div className="space-y-3">
              {requirements.filter(r => r.status === 'CLIENT_REVIEW' || r.status === 'FINALIZED' || r.status === 'CANCELED').slice(0, 4).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent client decisions.</p>
              ) : (
                requirements.filter(r => r.status === 'CLIENT_REVIEW' || r.status === 'FINALIZED' || r.status === 'CANCELED').slice(0, 4).map(r => (
                  <div 
                    key={r._id} 
                    onClick={() => setSelectedDecisionReq(r)}
                    className="flex items-center justify-between p-3 border border-slate-100 rounded text-xs cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-brand-200 transition-all duration-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{r.title}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Category: {r.category} | Version: v{r.version}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700' : 
                      r.status === 'CANCELED' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedDecisionReq && (
          <RequirementDetailsModal
            requirement={selectedDecisionReq}
            onClose={() => setSelectedDecisionReq(null)}
          />
        )}
      </div>
    );
  }

  if (user?.role === 'QA') {
    const assigned = requirements.filter(r => r.status === 'ASSIGNED' || r.status === 'UNDER_ANALYSIS' || r.status === 'REVALIDATION');
    const completed = requirements.filter(r => r.status === 'REPORT_GENERATED' || r.status === 'UNDER_REVIEW' || r.status === 'CLIENT_REVIEW' || r.status === 'FINALIZED');

    const deadlineStr = activeAssessment?.deadline || (activeAssessment ? new Date(new Date(activeAssessment.createdAt).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() : '');
    const isOverdue = deadlineStr ? new Date(deadlineStr).getTime() < Date.now() : false;
    const deadlineDate = deadlineStr ? new Date(deadlineStr).toLocaleDateString() : '';

    return (
      <div className="space-y-6">
        {/* Triggered Performance Assessment Notification (Non-blocking) */}
        {activeAssessment && (
          <div className={`${isOverdue ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-250'} border p-4 rounded flex items-center justify-between text-xs scale-in`}>
            <div className="flex items-center space-x-3">
              <ShieldAlert size={18} className={isOverdue ? 'text-red-600' : 'text-yellow-600'} />
              <div>
                <p className={`font-bold ${isOverdue ? 'text-red-800' : 'text-slate-800'}`}>
                  Triggered Performance Assessment (Pending) 
                  {isOverdue && <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">$50 Penalty Applies</span>}
                </p>
                <p className={`${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'} mt-0.5`}>
                  Due by: {deadlineDate}. {isOverdue ? 'OVERDUE!' : `Mistake weight limit reached (${activeAssessment.totalWeight} pts).`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAssessmentModal(true)}
              className={`${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white font-semibold px-3 py-1.5 rounded transition-all duration-150`}
            >
              Take Assessment
            </button>
          </div>
        )}

        {/* Assessment Modal Overlay */}
        {showAssessmentModal && activeAssessment && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 p-6 rounded shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto scale-in relative">
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Performance Assessment</h3>
              <p className="text-xs text-slate-500 mb-6">Review mistakes, checklist accuracy, and validation skills. Required to clear error limits.</p>
              
              {assessmentSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded text-xs font-semibold space-y-2">
                  <p>Assessment submitted successfully! Grading score: {activeAssessment.score || 85}%.</p>
                  {isOverdue && <p className="text-red-600">A penalty charge of $50 has been recorded due to late submission.</p>}
                </div>
              ) : (
                <form onSubmit={handleAssessmentSubmit} className="space-y-4 text-xs">
                  {activeAssessment.questions.map((question, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <label className="block font-semibold text-slate-700">
                        {idx + 1}. {question}
                      </label>
                      <textarea
                        required
                        value={answers[idx]}
                        onChange={(e) => {
                          const copy = [...answers];
                          copy[idx] = e.target.value;
                          setAnswers(copy);
                        }}
                        className="w-full border border-slate-200 rounded p-2 text-xs focus:outline-none focus:border-brand-500 min-h-[60px]"
                        placeholder="Provide details about your QA validation approach..."
                      />
                    </div>
                  ))}
                  <div className="flex space-x-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={submittingAssessment}
                      className="bg-brand-600 hover:bg-brand-700 text-white rounded px-4 py-2 font-semibold transition-all duration-150"
                    >
                      {submittingAssessment ? 'Submitting...' : 'SUBMIT PERFORMANCE ANSWERS'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssessmentModal(false)}
                      className="border border-slate-200 text-slate-500 hover:bg-slate-50 rounded px-4 py-2 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assigned Tasks</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{assigned.length}</h3>
            </div>
            <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed Reports</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{completed.length}</h3>
            </div>
            <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performance Status</p>
              <h3 className={`text-xs font-bold mt-1 ${activeAssessment ? 'text-red-600' : 'text-emerald-600'}`}>
                {activeAssessment ? 'AUDIT MANDATORY' : 'STABLE'}
              </h3>
            </div>
            <div className={`h-8 w-8 rounded flex items-center justify-center ${activeAssessment ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Assigned Requirements Analysis</h3>
          <div className="space-y-3">
            {assigned.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No requirements currently assigned for analysis.</p>
            ) : (
              assigned.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 border border-slate-100 rounded text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Project: {r.project} | Status: <span className="font-bold text-brand-600">{r.status}</span></p>
                  </div>
                  <Link to="/analysis" className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded text-[10px] font-semibold tracking-wider">
                    ANALYZE
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'CLIENT') {
    const pendingDecision = requirements.filter(r => r.status === 'CLIENT_REVIEW');
    const finalized = requirements.filter(r => r.status === 'FINALIZED');

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">My Requirements</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{requirements.length}</h3>
            </div>
            <div className="h-8 w-8 rounded bg-slate-50 flex items-center justify-center text-slate-600">
              <FileText size={16} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Decisions</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{pendingDecision.length}</h3>
            </div>
            <div className="h-8 w-8 rounded bg-yellow-50 flex items-center justify-center text-yellow-600">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 rounded flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finalized Docs</p>
              <h3 className="text-xl font-extrabold text-slate-800 mt-1">{finalized.length}</h3>
            </div>
            <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Pending Client Decisions</h3>
          <div className="space-y-3">
            {pendingDecision.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reports awaiting decision.</p>
            ) : (
              pendingDecision.map((r) => (
                <div key={r._id} className="flex items-center justify-between p-3 border border-slate-100 rounded text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Project: {r.project} | Version: v{r.version}</p>
                  </div>
                  <Link to="/recommendations" className="bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 rounded text-[10px] font-semibold tracking-wider">
                    DECIDE
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardPage;
