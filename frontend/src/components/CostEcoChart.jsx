import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function CostEcoChart({ primary, alternatives = [] }) {
  if (!primary) return null;

  // Prepare comparison data items
  const candidates = [
    {
      name: `${primary.material_code} (Primary)`,
      'Overall Score': primary.total_score,
      'Barrier Score': primary.barrier_score,
      'Cost Viability': primary.cost_score,
      'Sustainability': primary.sustainability_score,
    },
    ...alternatives.map((alt, idx) => ({
      name: `${alt.material_code} (${idx === 0 ? 'Eco' : 'Budget'})`,
      'Overall Score': alt.total_score,
      'Barrier Score': alt.barrier_score,
      'Cost Viability': alt.cost_score,
      'Sustainability': alt.sustainability_score,
    }))
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="pb-2 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Trade-off Analysis: Performance vs Cost vs Eco
        </h3>
        <p className="text-[11px] text-slate-500">Comparing Primary solution against alternative candidate materials</p>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={candidates} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            
            <Bar dataKey="Overall Score" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Barrier Score" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cost Viability" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sustainability" fill="#84cc16" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Higher Cost Viability score corresponds to a lower commercial packaging expense.</span>
      </div>
    </div>
  );
}
