import React from 'react';
import { X, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { Requirement } from '../types';

interface Props {
  requirement: Requirement;
  onClose: () => void;
}

export const RequirementDetailsModal: React.FC<Props> = ({ requirement, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scale-in relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded bg-brand-50 flex items-center justify-center text-brand-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{requirement.title}</h2>
            <p className="text-xs text-slate-500 font-medium">Project: {requirement.project} | Version: v{requirement.version}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Category</p>
            <p className="text-sm font-semibold text-slate-700">{requirement.category}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center mt-0.5">
              {requirement.status === 'FINALIZED' ? (
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1">
                  <CheckCircle2 size={12} />
                  <span>FINALIZED</span>
                </span>
              ) : requirement.status === 'CANCELED' ? (
                <span className="bg-red-50 border border-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1">
                  <XCircle size={12} />
                  <span>CANCELED</span>
                </span>
              ) : (
                <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {requirement.status.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-100 col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Updated</p>
            <p className="text-sm font-semibold text-slate-700">{new Date(requirement.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
          <div className="prose prose-sm prose-slate max-w-none text-xs whitespace-pre-wrap leading-relaxed">
            {requirement.description}
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold px-4 py-2 rounded text-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
