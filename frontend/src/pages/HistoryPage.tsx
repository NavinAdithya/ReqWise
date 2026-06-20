import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import type { Requirement } from '../types';
import { RequirementDetailsModal } from '../components/RequirementDetailsModal';

export const HistoryPage: React.FC = () => {
  const { requirements, fetchRequirements, loading } = useStore();
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  const finalizedReqs = requirements.filter((r) => r.status === 'FINALIZED' || r.status === 'CANCELED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <History size={16} className="text-slate-600" />
          <span>Finalized Archive History</span>
        </h2>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        {loading ? (
          <div className="flex h-40 w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Version</th>
                <th className="px-6 py-3">Completed Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {finalizedReqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No history records found.
                  </td>
                </tr>
              ) : (
                finalizedReqs.map((req) => (
                  <tr 
                    key={req._id} 
                    onClick={() => setSelectedReq(req)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">{req.title}</td>
                    <td className="px-6 py-4 text-slate-600">{req.project}</td>
                    <td className="px-6 py-4 text-slate-500">{req.category}</td>
                    <td className="px-6 py-4 text-slate-500">v{req.version}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(req.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'FINALIZED' ? (
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1 w-max">
                          <CheckCircle2 size={10} />
                          <span>FINALIZED</span>
                        </span>
                      ) : (
                        <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1 w-max">
                          <XCircle size={10} />
                          <span>CANCELED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedReq && (
        <RequirementDetailsModal 
          requirement={selectedReq}
          onClose={() => setSelectedReq(null)}
        />
      )}
    </div>
  );
};

export default HistoryPage;
