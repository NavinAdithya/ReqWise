import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { useForm } from 'react-hook-form';
import { Plus, UserPlus, CheckCircle2 } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { requirements, createRequirement, assignQA, loading, error } = useStore();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningReqId, setAssigningReqId] = useState<string | null>(null);
  const [qaIdInput, setQaIdInput] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'OVERVIEW'>('OVERVIEW');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; finalized: number; assigned: number; draft: number; category: string }> = {};
    requirements.forEach(req => {
      if (!stats[req.project]) {
        stats[req.project] = { total: 0, finalized: 0, assigned: 0, draft: 0, category: req.category };
      }
      stats[req.project].total++;
      if (req.status === 'FINALIZED') stats[req.project].finalized++;
      else if (req.status === 'DRAFT') stats[req.project].draft++;
      else stats[req.project].assigned++;
    });
    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [requirements]);

  // Extract unique clients and QAs from history for quick selection
  const clientMap = new Map<string, string>();
  const qaMap = new Map<string, string>();
  
  requirements.forEach((r) => {
    if (r.client && typeof r.client === 'object') {
      clientMap.set(r.client._id, r.client.name);
    } else if (r.client && typeof r.client === 'string') {
      clientMap.set(r.client, 'Client User');
    }
    
    if (r.assignedQA && typeof r.assignedQA === 'object') {
      qaMap.set(r.assignedQA._id, r.assignedQA.name);
    }
  });

  const clientsList = Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }));
  const qasList = Array.from(qaMap.entries()).map(([id, name]) => ({ id, name }));

  const onCreateSubmit = async (data: any) => {
    try {
      await createRequirement(data);
      reset();
      setShowCreateForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningReqId || !qaIdInput.trim()) return;
    setAssignError(null);
    try {
      await assignQA(assigningReqId, qaIdInput.trim());
      setAssigningReqId(null);
      setQaIdInput('');
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign QA');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">REQWISE Projects Registry</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition-all duration-150"
        >
          <Plus size={14} />
          <span>Upload Requirement</span>
        </button>
      </div>

      {/* Upload Requirement Form */}
      {showCreateForm && (
        <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm p-6 scale-in">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">New Requirement Upload</h3>
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-2.5 rounded text-xs font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                  placeholder="e.g. Transaction API Gateway"
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.title.message)}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Name</label>
                <input
                  type="text"
                  {...register('project', { required: 'Project name is required' })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                  placeholder="e.g. Project Ledger"
                />
                {errors.project && <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.project.message)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                >
                  <option value="">Select Category</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Web Development">Web Development</option>
                </select>
                {errors.category && <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.category.message)}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Client User ID</label>
                {clientsList.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      onChange={(e) => setValue('client', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                    >
                      <option value="">Select Existing Client</option>
                      {clientsList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      {...register('client', { required: 'Client ID is required' })}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                      placeholder="Or paste client user Object ID directly"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    {...register('client', { required: 'Client ID is required' })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                    placeholder="Enter client user Object ID"
                  />
                )}
                {errors.client && <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.client.message)}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
              <textarea
                rows={4}
                {...register('description', { required: 'Description is required' })}
                className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                placeholder="Detail the requirement details here..."
              />
              {errors.description && <p className="text-[10px] text-red-500 mt-1 font-medium">{String(errors.description.message)}</p>}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded px-4 py-2 text-xs font-semibold"
              >
                {loading ? 'Uploading...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="border border-slate-200 text-slate-500 rounded px-4 py-2 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QA Assignment Modal Overlay */}
      {assigningReqId && (
        <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm p-6 scale-in max-w-md">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Assign QA Member</h3>
          <p className="text-xs text-slate-500 mb-4">Select an active QA or enter a Mongoose QA User Object ID to assign this requirement.</p>
          
          {assignError && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-600 p-2 rounded text-xs font-medium">
              {assignError}
            </div>
          )}

          <form onSubmit={handleAssignQA} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">QA Selection</label>
              {qasList.length > 0 && (
                <select
                  onChange={(e) => setQaIdInput(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-xs mb-2"
                >
                  <option value="">Select Existing QA</option>
                  {qasList.map((q) => (
                    <option key={q.id} value={q.id}>{q.name} ({q.id})</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={qaIdInput}
                onChange={(e) => setQaIdInput(e.target.value)}
                placeholder="Or paste Mongoose User ID directly..."
                className="w-full border border-slate-200 rounded px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded px-4 py-2 text-xs font-semibold"
              >
                Assign
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssigningReqId(null);
                  setQaIdInput('');
                  setAssignError(null);
                }}
                className="border border-slate-200 text-slate-500 rounded px-4 py-2 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex space-x-6 border-b border-slate-200">
        <button 
          onClick={() => { setViewMode('OVERVIEW'); setSelectedProject(null); }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider ${viewMode === 'OVERVIEW' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Project Overview
        </button>
        <button 
          onClick={() => { setViewMode('LIST'); setSelectedProject(null); }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider ${viewMode === 'LIST' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          All Requirements
        </button>
      </div>

      {viewMode === 'OVERVIEW' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 scale-in">
          {projectStats.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">No projects found.</div>
          ) : (
            projectStats.map((proj, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  setSelectedProject(proj.name);
                  setViewMode('LIST');
                }}
                className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{proj.category}</span>
                    <h3 className="text-sm font-bold text-slate-800 mt-1">{proj.name}</h3>
                  </div>
                  <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full text-[10px]">
                    {proj.total} Specs
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                      <span>Completion</span>
                      <span>{Math.round((proj.finalized / proj.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(proj.finalized / proj.total) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Finalized</p>
                      <p className="text-lg font-black text-emerald-600">{proj.finalized}</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
                      <p className="text-lg font-black text-brand-600">{proj.assigned}</p>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Drafts</p>
                      <p className="text-lg font-black text-slate-600">{proj.draft}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-sm overflow-hidden scale-in">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Project</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Version</th>
                <th className="px-6 py-3">QA Assigned</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {requirements.filter(req => !selectedProject || req.project === selectedProject).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No requirements found for this view.
                  </td>
                </tr>
              ) : (
                requirements.filter(req => !selectedProject || req.project === selectedProject).map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{req.title}</td>
                    <td className="px-6 py-4 text-slate-600">{req.project}</td>
                    <td className="px-6 py-4 text-slate-500">{req.category}</td>
                    <td className="px-6 py-4 text-slate-500">v{req.version}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {req.assignedQA ? (
                        <span className="flex items-center space-x-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          <span>{req.assignedQA.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        req.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700' :
                        req.status === 'DRAFT' ? 'bg-slate-50 text-slate-700' :
                        'bg-brand-50 text-brand-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'DRAFT' && (
                        <button
                          onClick={() => setAssigningReqId(req._id)}
                          className="text-brand-600 hover:text-brand-700 font-semibold flex items-center space-x-1"
                        >
                          <UserPlus size={14} />
                          <span>Assign QA</span>
                        </button>
                      )}
                      {req.status !== 'DRAFT' && (
                        <span className="text-slate-400 flex items-center space-x-1 font-medium">
                          <CheckCircle2 size={14} />
                          <span>Managed</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
