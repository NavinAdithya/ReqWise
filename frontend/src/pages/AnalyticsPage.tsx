import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { mistakeService } from '../services/mistakes';
import type { Mistake } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { BarChart3, HelpCircle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { analytics, fetchAnalytics, loading, user } = useStore();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    if (user?.role === 'ADMIN') {
      setLoadingMistakes(true);
      mistakeService.getAllMistakes().then(res => {
        setMistakes(res.mistakes);
      }).catch(err => {
        console.error('Failed to load mistakes', err);
      }).finally(() => setLoadingMistakes(false));
    }
  }, [fetchAnalytics, user]);

  if (loading) {
    return (
      <div className="flex h-60 w-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
        <HelpCircle size={48} strokeWidth={1.5} />
        <p className="text-xs">No analytics data available.</p>
      </div>
    );
  }

  // Calculate Approval Rate: (FINALIZED / TOTAL) * 100
  const reqStatusData = analytics.requirementsByStatus || [];
  const finalizedCount = reqStatusData.find(d => d.status === 'FINALIZED')?.count || 0;
  const totalCount = reqStatusData.reduce((acc, curr) => acc + curr.count, 0);
  const approvalRate = totalCount > 0 ? Math.round((finalizedCount / totalCount) * 100) : 100;

  const approvalPieData = [
    { name: 'Finalized', value: finalizedCount },
    { name: 'Pending/Draft', value: Math.max(totalCount - finalizedCount, 0) }
  ];
  
  const PIE_COLORS = ['#10b981', '#cbd5e1'];

  // Mistakes Category Data
  const mistakesCategoryData = analytics.mistakesByCategory || [];

  // Mistakes Type Data
  const mistakesTypeData = analytics.mistakesByType || [];

  // QA Assessments Data
  const assessmentsData = analytics.qaAssessments || [];
  const chartAssessments = assessmentsData
    .filter(a => a.status === 'COMPLETED')
    .map(a => ({
      name: a.qaName.split(' ')[0],
      score: a.score,
      weight: a.totalWeight
    }));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
          <BarChart3 size={16} className="text-brand-600" />
          <span>Platform Performance Audits</span>
        </h2>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Chart 1: Approval Rate */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[280px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Requirements Approval Rate</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-1/3 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-800">{approvalRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Finalized Rate</span>
            </div>
            <div className="w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {approvalPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Requirements`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 2: QA Validation Accuracy (Assessment Scores) */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[280px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">QA Assessment Accuracy</h3>
          <div className="flex-1">
            {chartAssessments.length === 0 ? (
              <p className="text-center text-slate-400 py-16">No QA assessment logs available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartAssessments} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip formatter={(value) => [`${value}% Accuracy`, 'Score']} />
                  <Bar dataKey="score" fill="#0284c7" radius={[2, 2, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 3: Mistake Trends by Category */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[280px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Mistake Trends by Category</h3>
          <div className="flex-1">
            {mistakesCategoryData.length === 0 ? (
              <p className="text-center text-slate-400 py-16">No logged mistakes found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mistakesCategoryData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} Mistakes`, 'Count']} />
                  <Bar dataKey="count" fill="#e11d48" radius={[2, 2, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: Mistakes Distribution by Type */}
        <div className="bg-white border border-slate-200 rounded p-6 flex flex-col h-[280px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Mistakes Distribution by Type</h3>
          <div className="flex-1">
            {mistakesTypeData.length === 0 ? (
              <p className="text-center text-slate-400 py-16">No logged mistakes found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mistakesTypeData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mistakeType" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} Instances`, 'Count']} />
                  <Line type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={2} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* QA Mistake Data Section (Admin Only) */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">QA Analyst Mistake Log</h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
              {mistakes.length} Total Mistakes
            </span>
          </div>
          
          {loadingMistakes ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading mistakes...</div>
          ) : mistakes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No mistakes logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-2">QA Analyst</th>
                    <th className="px-4 py-2">Requirement ID</th>
                    <th className="px-4 py-2">Mistake Type</th>
                    <th className="px-4 py-2">Severity</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {mistakes.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {(m.qa as any) ? (typeof (m.qa as any) === 'object' && (m.qa as any) !== null && 'name' in (m.qa as any) ? (m.qa as any).name : m.qa) : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[10px]">
                        {(m.requirement as any) ? (typeof (m.requirement as any) === 'object' && (m.requirement as any) !== null && 'title' in (m.requirement as any) ? (m.requirement as any).title || (m.requirement as any)._id : m.requirement) : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-brand-600 font-medium">{m.mistakeType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          m.severity === 'HIGH' ? 'bg-red-50 text-red-700' :
                          m.severity === 'MEDIUM' ? 'bg-orange-50 text-orange-700' :
                          'bg-yellow-50 text-yellow-700'
                        }`}>
                          {m.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
