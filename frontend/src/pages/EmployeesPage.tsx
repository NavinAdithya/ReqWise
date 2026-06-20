import React, { useEffect, useState } from 'react';
import userService from '../services/users';
import { Users, Award, AlertTriangle, FileText, Activity, X } from 'lucide-react';
import { request } from '../services/api';

export const EmployeesPage: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedQA, setSelectedQA] = useState<any | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await userService.getQAPerformance();
        setPerformanceData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch QA performance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTriggerAssessment = async (qaId: string) => {
    setTriggering(true);
    setTriggerError(null);
    setTriggerSuccess(null);
    try {
      await request(`/assessments/trigger/${qaId}`, { method: 'POST' });
      setTriggerSuccess('Assessment generated successfully!');
    } catch (err: any) {
      setTriggerError(err.message || 'Failed to trigger assessment');
    } finally {
      setTriggering(false);
    }
  };

  const closeDialog = () => {
    setSelectedQA(null);
    setTriggerError(null);
    setTriggerSuccess(null);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500 text-xs">Loading performance data...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 text-xs bg-red-50 rounded border border-red-100">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">QA Performance Center</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Analyze accuracy, assignment loads, and mistake histories of QA Analysts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {performanceData.map((qaData) => (
          <div 
            key={qaData.qa._id} 
            className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm p-6 flex flex-col hover:shadow-md transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            onClick={() => setSelectedQA(qaData)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-brand-50 text-brand-600 p-2 rounded-full">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{qaData.qa.name} <span className="text-[10px] text-slate-400 font-normal">({qaData.qa._id})</span></h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{qaData.qa.email}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded ${qaData.accuracy >= 80 ? 'bg-emerald-100 text-emerald-700' : qaData.accuracy >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {qaData.accuracy}% Accuracy
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                <span className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
                  <FileText size={10} />
                  <span>Assignments</span>
                </span>
                <span className="text-xl font-black text-slate-700">{qaData.stats.assigned}</span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                <span className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
                  <Award size={10} />
                  <span>Avg Assessment</span>
                </span>
                <span className="text-xl font-black text-slate-700">
                  {qaData.assessments.length > 0 
                    ? Math.round(qaData.assessments.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / qaData.assessments.length) + '%' 
                    : 'N/A'}
                </span>
              </div>
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center transition-transform hover:scale-105 duration-200">
                <span className="flex items-center justify-center space-x-1 text-[9px] font-bold text-slate-400 uppercase mb-1">
                  <AlertTriangle size={10} />
                  <span>Penalties</span>
                </span>
                <span className="text-xl font-black text-red-600">
                  ${qaData.assessments.reduce((sum: number, a: any) => sum + (a.penaltyCharge || 0), 0)}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                <AlertTriangle size={12} className="text-slate-400" />
                <span>Mistake Log Overview</span>
              </h4>
              {qaData.mistakes.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic">No mistakes logged.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(
                    qaData.mistakes.reduce((acc: any, m: any) => {
                      acc[m.mistakeType] = (acc[m.mistakeType] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-600 truncate mr-2 font-medium">- {type}</span>
                      <span className="bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded text-[9px]">
                        {String(count)}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {performanceData.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">No QA Analysts found.</div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedQA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] scale-in">
            <div className="flex justify-between items-center border-b border-slate-200/60 p-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedQA.qa.name} <span className="text-[10px] font-normal text-slate-500">({selectedQA.qa._id})</span></h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Detailed Performance & Active Reviews</p>
              </div>
              <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Active Reviews */}
              <div>
                <h4 className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3 flex items-center space-x-1 border-b border-brand-100 pb-1">
                  <Activity size={12} />
                  <span>Currently Reviewing</span>
                </h4>
                {selectedQA.activeReviews && selectedQA.activeReviews.length > 0 ? (
                  <div className="space-y-2">
                    {selectedQA.activeReviews.map((ar: any) => (
                      <div key={ar._id} className="bg-slate-50 border border-slate-200 rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{ar.title}</p>
                          <p className="text-[10px] text-slate-500">{ar.project} • {ar.category}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-1 rounded">
                          {ar.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100">No active reviews at this moment.</p>
                )}
              </div>

              {/* Detailed Mistakes */}
              <div>
                <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center space-x-1 border-b border-red-100 pb-1">
                  <AlertTriangle size={12} />
                  <span>Mistake History</span>
                </h4>
                {selectedQA.mistakes && selectedQA.mistakes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedQA.mistakes.map((m: any) => (
                      <div key={m._id} className="bg-red-50 border border-red-100 rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{m.mistakeType}</p>
                          <p className="text-[10px] text-slate-600">Project: {m.project} • Category: {m.category}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${m.severity === 'HIGH' ? 'bg-red-200 text-red-800' : m.severity === 'MEDIUM' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {m.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100">Clean record. No mistakes logged.</p>
                )}
              </div>

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                {triggerError && <span className="text-[10px] font-bold text-red-600">{triggerError}</span>}
                {triggerSuccess && <span className="text-[10px] font-bold text-emerald-600">{triggerSuccess}</span>}
              </div>
              <button 
                onClick={() => handleTriggerAssessment(selectedQA.qa._id)}
                disabled={triggering}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {triggering ? 'GENERATING AI TEST...' : 'TRIGGER MANUAL TEST'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
