import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

export default function ScoreRadarChart({ primary, alternatives = [] }) {
  const [showEco, setShowEco] = useState(true);
  const [showBudget, setShowBudget] = useState(false);

  if (!primary) return null;

  const ecoAlt = alternatives[0];
  const budgetAlt = alternatives[1];

  // Prepare radar dataset
  const data = [
    {
      subject: 'Barrier Performance',
      Primary: primary.barrier_score,
      ...(ecoAlt && { Eco: ecoAlt.barrier_score }),
      ...(budgetAlt && { Budget: budgetAlt.barrier_score }),
      fullMark: 100,
    },
    {
      subject: 'Chemical Compat',
      Primary: primary.compatibility_score,
      ...(ecoAlt && { Eco: ecoAlt.compatibility_score }),
      ...(budgetAlt && { Budget: budgetAlt.compatibility_score }),
      fullMark: 100,
    },
    {
      subject: 'Thermal Window',
      Primary: primary.storage_score,
      ...(ecoAlt && { Eco: ecoAlt.storage_score }),
      ...(budgetAlt && { Budget: budgetAlt.storage_score }),
      fullMark: 100,
    },
    {
      subject: 'Mechanical & Seal',
      Primary: primary.mechanical_score,
      ...(ecoAlt && { Eco: ecoAlt.mechanical_score }),
      ...(budgetAlt && { Budget: budgetAlt.mechanical_score }),
      fullMark: 100,
    },
    {
      subject: 'Cost Viability',
      Primary: primary.cost_score,
      ...(ecoAlt && { Eco: ecoAlt.cost_score }),
      ...(budgetAlt && { Budget: budgetAlt.cost_score }),
      fullMark: 100,
    },
    {
      subject: 'Sustainability',
      Primary: primary.sustainability_score,
      ...(ecoAlt && { Eco: ecoAlt.sustainability_score }),
      ...(budgetAlt && { Budget: budgetAlt.sustainability_score }),
      fullMark: 100,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Multi-Attribute Performance Radar
          </h3>
          <p className="text-[11px] text-slate-500">Overlay comparison across 6 evaluation criteria</p>
        </div>

        {/* Toggle checkboxes for comparison */}
        <div className="flex items-center gap-3 text-xs font-medium">
          {ecoAlt && (
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-800">
              <input
                type="checkbox"
                checked={showEco}
                onChange={(e) => setShowEco(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span>Overlay Eco</span>
            </label>
          )}

          {budgetAlt && (
            <label className="flex items-center gap-1.5 cursor-pointer text-blue-800">
              <input
                type="checkbox"
                checked={showBudget}
                onChange={(e) => setShowBudget(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Overlay Budget</span>
            </label>
          )}
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
            
            {/* Primary Recommendation Radar */}
            <Radar
              name={`Primary: ${primary.material_code}`}
              dataKey="Primary"
              stroke="#059669"
              fill="#10b981"
              fillOpacity={0.45}
            />

            {/* Eco Alternative Radar */}
            {ecoAlt && showEco && (
              <Radar
                name={`Eco: ${ecoAlt.material_code}`}
                dataKey="Eco"
                stroke="#0284c7"
                fill="#38bdf8"
                fillOpacity={0.3}
              />
            )}

            {/* Budget Alternative Radar */}
            {budgetAlt && showBudget && (
              <Radar
                name={`Budget: ${budgetAlt.material_code}`}
                dataKey="Budget"
                stroke="#f59e0b"
                fill="#fbbf24"
                fillOpacity={0.25}
              />
            )}

            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Higher values indicate superior performance in that dimension (Scale: 0–100).</span>
      </div>
    </div>
  );
}
