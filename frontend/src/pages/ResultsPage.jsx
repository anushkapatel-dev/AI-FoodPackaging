import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  Scale,
  Printer,
  ChevronDown,
  ChevronUp,
  Layers,
  Leaf,
  AlertTriangle,
  Wind,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info,
  Sliders,
  Loader2,
  FileText,
  Droplets,
  Sparkles
} from 'lucide-react';
import ReportModal from '../components/ReportModal';
import ScoreRadarChart from '../components/ScoreRadarChart';
import CostEcoChart from '../components/CostEcoChart';
import { recommendPackaging } from '../services/api';

const RISK_BADGE_STYLES = {
  VERY_HIGH: 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold',
  HIGH: 'bg-amber-100 text-amber-900 border-amber-200 font-bold',
  MEDIUM: 'bg-blue-50 text-blue-800 border-blue-200 font-medium',
  LOW: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium',
  REQUIRED: 'bg-forest-100 text-forest-900 border-forest-300 font-bold',
  NOT_REQUIRED: 'bg-slate-100 text-slate-600 border-slate-200 font-normal',
  RECOMMENDED: 'bg-blue-100 text-blue-900 border-blue-200 font-bold'
};

const PRIORITY_OPTIONS = [
  { id: 'Balanced', label: 'Balanced (Multi-Criteria)' },
  { id: 'Barrier Performance', label: 'Barrier Performance' },
  { id: 'Cost', label: 'Cost-Optimized' },
  { id: 'Sustainability', label: 'Sustainability / Circular' }
];

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try state first, fallback to localStorage
  const [result, setResult] = useState(() => {
    if (location.state?.recommendation) return location.state.recommendation;
    const cachedResult = localStorage.getItem('packai_last_recommendation');
    return cachedResult ? JSON.parse(cachedResult) : null;
  });

  const [requestData, setRequestData] = useState(() => {
    if (location.state?.formData) return location.state.formData;
    const cachedReq = localStorage.getItem('packai_last_request');
    return cachedReq ? JSON.parse(cachedReq) : null;
  });

  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [showTechnicalReasoning, setShowTechnicalReasoning] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [reevalError, setReevalError] = useState(null);

  // If no recommendation is found in memory, render clean error state
  if (!result || !result.primary_recommendation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-navy-950">No Recommendation Available</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Please run the packaging specification wizard first to generate an evidence-backed material recommendation.
        </p>
        <Link
          to="/wizard"
          className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Go to Wizard</span>
        </Link>
      </div>
    );
  }

  const primary = result.primary_recommendation;
  const rankedMaterials = result.ranked_materials && result.ranked_materials.length > 0 
    ? result.ranked_materials 
    : [];
  const alternatives = result.alternative_materials || [];
  const reqs = result.packaging_requirements || result.calculated_requirements || {};
  const riskProfile = result.risk_profile || {};
  const risks = result.detected_risks || [];
  const rejected = result.rejection_reasons || result.rejected_materials || [];
  const produce = result.fresh_produce_guidance;
  const scoreBreakdown = primary.score_breakdown;

  // Total layer thickness
  const totalThicknessMicrons = primary.layers && primary.layers.length > 0
    ? primary.layers.reduce((sum, l) => sum + (l.typical_thickness_microns || 0), 0)
    : 50;

  const handleGoToCompare = () => {
    const ids = [primary.material_id, ...alternatives.map((a) => a.material_id)].slice(0, 4);
    navigate('/compare', { state: { materialIds: ids } });
  };

  // Interactive Priority Change handler: calls backend and updates UI live
  const handlePriorityChange = async (newPriority) => {
    if (!requestData || isReevaluating || result.user_priority === newPriority) return;
    setIsReevaluating(true);
    setReevalError(null);

    try {
      const updatedPayload = {
        ...requestData,
        user_priority: newPriority
      };
      const response = await recommendPackaging(updatedPayload);
      setResult(response);
      setRequestData(updatedPayload);
      localStorage.setItem('packai_last_recommendation', JSON.stringify(response));
      localStorage.setItem('packai_last_request', JSON.stringify(updatedPayload));
    } catch (err) {
      console.error('Failed to re-evaluate with new priority:', err);
      setReevalError('Failed to communicate with backend. Previous recommendation retained.');
    } finally {
      setIsReevaluating(false);
    }
  };

  const selectedLayer = primary.layers && primary.layers[selectedLayerIndex] 
    ? primary.layers[selectedLayerIndex] 
    : (primary.layers && primary.layers[0] ? primary.layers[0] : null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. TOP HEADER & AUDIT SUMMARY BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                Decision Support Output • SIH PS 26236
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Data Status: {result.data_status || 'DEMO DATA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-1">
              Specification for: <span className="text-navy-800">{result.commodity_name}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsReportOpen(true)}
              className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate PDF / Spec Sheet</span>
            </button>

            <button
              onClick={handleGoToCompare}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-navy-700" />
              <span>Full Comparison Matrix</span>
            </button>

            <Link
              to="/wizard"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>New Evaluation</span>
            </Link>
          </div>
        </div>

        {/* A. FOOD PROFILE & STORAGE CONTEXT */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-navy-800" />
              <span>A. Food Commodity Profile & Storage Context</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Input Parameters</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Commodity</span>
              <strong className="text-navy-950 text-xs truncate block">{result.commodity_name}</strong>
              <span className="text-[9px] text-slate-500">{produce ? 'Fresh Produce' : 'Processed'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Moisture</span>
              <strong className="text-navy-950 text-xs block">{requestData?.moisture_content_percent}%</strong>
              <span className="text-[9px] text-slate-500">Water content</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Lipid Fat</span>
              <strong className="text-navy-950 text-xs block">{requestData?.fat_content_percent}%</strong>
              <span className="text-[9px] text-slate-500">Fat fraction</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Acidity</span>
              <strong className="text-navy-950 text-xs block">pH {requestData?.ph_value}</strong>
              <span className="text-[9px] text-slate-500">{requestData?.ph_value < 4.5 ? 'Acidic' : 'Low Acid'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Storage</span>
              <strong className="text-navy-950 text-xs block">{requestData?.storage_type}</strong>
              <span className="text-[9px] text-slate-500">{requestData?.storage_temperature_c}°C</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Humidity</span>
              <strong className="text-navy-950 text-xs block">{requestData?.relative_humidity_percent}%</strong>
              <span className="text-[9px] text-slate-500">Ambient RH</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Shelf Life</span>
              <strong className="text-navy-950 text-xs block">{requestData?.desired_shelf_life_days} Days</strong>
              <span className="text-[9px] text-slate-500">{Math.round((requestData?.desired_shelf_life_days || 90) / 30)} Months</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Logistics</span>
              <strong className="text-navy-950 text-xs truncate block">{requestData?.transportation_condition}</strong>
              <span className="text-[9px] text-slate-500">Transit Mode</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE PRIORITY SWITCHER BAR */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-navy-950">
            <Sliders className="w-4 h-4 text-navy-700" />
            <span>Optimization Priority:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRIORITY_OPTIONS.map((opt) => {
              const isActive = result.user_priority === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handlePriorityChange(opt.id)}
                  disabled={isReevaluating}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-navy-900 text-white border-navy-950 shadow-xs ring-1 ring-navy-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  } disabled:opacity-50`}
                >
                  {isReevaluating && isActive ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Evaluating...
                    </span>
                  ) : (
                    opt.label
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {reevalError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{reevalError}</span>
          </div>
        )}
      </div>

      {/* 2. SECTION B: FOOD RISK ANALYSIS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>B. Food Risk Analysis</span>
            </h3>
            <p className="text-xs text-slate-500">
              Deterministic evaluation of product moisture, lipid fractions, ambient humidity, and logistics:
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Qualitative Risk Tiers</span>
        </div>

        {/* 7 Risk Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Moisture Risk</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.moisture_risk] || 'bg-slate-100'}`}>
              {riskProfile.moisture_risk || 'MEDIUM'}
            </span>
            <span className="text-[9px] text-slate-400 block">RH & Hydration</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Oxygen Risk</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.oxygen_risk] || 'bg-slate-100'}`}>
              {riskProfile.oxygen_risk || 'MEDIUM'}
            </span>
            <span className="text-[9px] text-slate-400 block">Lipid Rancidity</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Light / UV Risk</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.light_risk] || 'bg-slate-100'}`}>
              {riskProfile.light_risk || 'LOW'}
            </span>
            <span className="text-[9px] text-slate-400 block">Photo-Oxidation</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Fat/Oil Interaction</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.fat_oil_risk] || 'bg-slate-100'}`}>
              {riskProfile.fat_oil_risk || 'LOW'}
            </span>
            <span className="text-[9px] text-slate-400 block">Lipid Swelling</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Thermal Risk</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.temperature_risk] || 'bg-slate-100'}`}>
              {riskProfile.temperature_risk || 'LOW'}
            </span>
            <span className="text-[9px] text-slate-400 block">Cold/Heat Chain</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Mechanical Stress</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${RISK_BADGE_STYLES[riskProfile.mechanical_risk] || 'bg-slate-100'}`}>
              {riskProfile.mechanical_risk || 'LOW'}
            </span>
            <span className="text-[9px] text-slate-400 block">Freight Vibration</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Respiration Need</span>
            <span className={`text-[11px] px-2 py-0.5 rounded border inline-block ${riskProfile.respiration_required ? RISK_BADGE_STYLES.REQUIRED : RISK_BADGE_STYLES.NOT_REQUIRED}`}>
              {riskProfile.respiration_required ? 'REQUIRED' : 'NOT REQUIRED'}
            </span>
            <span className="text-[9px] text-slate-400 block">Produce Gas Exch</span>
          </div>

        </div>

        {/* Detailed Risk Statements */}
        {risks.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs text-slate-700">
            <span className="font-bold text-navy-950 block text-[11px]">Identified Degradation Mechanisms:</span>
            <ul className="space-y-1">
              {risks.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. SECTION C: PACKAGING REQUIREMENTS */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              <span>C. Packaging Requirements</span>
            </h3>
            <p className="text-xs text-slate-500">
              Target engineering thresholds translated directly from the chemical risk profile:
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Status: DEMO DATA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Oxygen Barrier</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.oxygen_barrier || reqs.required_oxygen_barrier?.replace('_', ' ') || 'LOW'}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">ASTM F1927</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Moisture Barrier</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.moisture_barrier || reqs.required_moisture_barrier?.replace('_', ' ') || 'LOW'}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">ASTM F1249</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Light Shielding</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.light_barrier || reqs.required_light_barrier || 'TRANSPARENT'}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">UV Optical Block</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Mechanical Tensile</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.mechanical_strength || reqs.required_mechanical_strength || 'MEDIUM'}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">ASTM D882</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Heat Sealability</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.sealability || reqs.required_sealability || 'GOOD'}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">Hermetic Crimp</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Gas Exchange</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.gas_exchange || (riskProfile.respiration_required ? 'REQUIRED' : 'NOT REQUIRED')}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">Aerobic Protocol</span>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">MAP Suitability</span>
            <strong className="text-xs font-extrabold text-navy-950 block mt-0.5">
              {reqs.map_suitability || (produce ? 'REQUIRED' : 'NOT REQUIRED')}
            </strong>
            <span className="text-[9px] text-slate-400 block mt-0.5">N2/CO2 Flush</span>
          </div>

        </div>
      </div>

      {/* 4. SECTION D: RECOMMENDED PACKAGING & E. PROTOTYPE COMPATIBILITY SCORE */}
      <div className="bg-white rounded-xl border-2 border-navy-900 p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="bg-navy-900 text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded">
              D. Recommended Packaging Solution
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Code: {primary.material_code}
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {primary.material_type}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              {primary.data_status}
            </span>
            <span className="text-[10px] font-bold text-navy-800 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              {primary.sustainability_badge}
            </span>
          </div>
        </div>

        {/* Title & Prototype Compatibility Score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Top Ranked Substrate (Rank #1)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
              {primary.material_name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {primary.why_selected && primary.why_selected.length > 0
                ? primary.why_selected[0]
                : 'Engine-selected barrier structure satisfying product shelf-life and chemical compatibility requirements.'}
            </p>
          </div>

          {/* Prototype Compatibility Score Badge & Mandatory Note */}
          <div className="flex flex-col items-start md:items-end gap-1 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800">
              E. Prototype Compatibility Score
            </span>
            <div className="bg-navy-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-400">Score</span>
              <span className="text-3xl font-black text-white">{primary.total_score}</span>
              <span className="text-xs text-slate-300 font-bold">/100</span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs text-left md:text-right italic leading-tight">
              This is an algorithmic decision-support score based on configured prototype criteria and is not a laboratory-validated performance rating.
            </p>
          </div>
        </div>

        {/* Multilayer Material Structure Visualization (Requirement 6) */}
        {primary.layers && primary.layers.length > 0 && (
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-navy-800" />
                  <span>Multilayer Material Structure Stack ({primary.layers.length} Plies • Total {totalThicknessMicrons} µm)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Actual laminate ply composition returned by the backend engine:
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Outer Ply → Barrier Core → Inner Sealant
              </span>
            </div>

            {/* Vertical Layer Flow Display */}
            <div className="flex flex-col items-center gap-1.5 py-1">
              {primary.layers.map((layer, idx) => (
                <React.Fragment key={idx}>
                  <div className="w-full max-w-xl p-3 bg-white rounded-lg border border-slate-300 shadow-2xs flex items-center justify-between text-xs hover:border-navy-400 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <strong className="text-navy-950 text-xs block">{layer.layer_name}</strong>
                        <span className="text-[11px] text-slate-500 leading-tight">{layer.purpose}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 flex-shrink-0 ml-2">
                      {layer.typical_thickness_microns} µm
                    </span>
                  </div>
                  {idx < primary.layers.length - 1 && (
                    <div className="text-slate-400 font-bold text-xs">↓</div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Interactive 2D Cross Section Bar */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Interactive Cross-Section Preview (Click ply to inspect):
              </span>
              <div className="flex rounded-md overflow-hidden h-10 shadow-inner border border-slate-300 divide-x divide-white">
                {primary.layers.map((layer, idx) => {
                  const isSelected = selectedLayerIndex === idx;
                  const palette = [
                    'bg-navy-800 text-white',
                    'bg-slate-300 text-slate-900',
                    'bg-slate-600 text-white',
                    'bg-navy-600 text-white',
                    'bg-amber-800 text-white'
                  ];
                  const colorClass = palette[idx % palette.length];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedLayerIndex(idx)}
                      className={`${colorClass} flex-1 flex flex-col items-center justify-center text-center p-1 cursor-pointer transition-all hover:opacity-90 ${
                        isSelected ? 'ring-2 ring-saffron-500 z-10' : ''
                      }`}
                    >
                      <span className="text-[10px] font-bold truncate max-w-full px-1">
                        {layer.layer_name}
                      </span>
                      <span className="text-[9px] font-mono opacity-80">
                        {layer.typical_thickness_microns} µm
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Layer Detail Box */}
            {selectedLayer && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in duration-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Substrate Ply</span>
                  <strong className="text-navy-950 font-bold">{selectedLayer.layer_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Thickness</span>
                  <strong className="text-navy-950 font-mono">{selectedLayer.typical_thickness_microns} µm</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Engineering Purpose</span>
                  <span className="text-slate-700">{selectedLayer.purpose}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SECTION F: VISUAL SCORE BREAKDOWN */}
        {scoreBreakdown && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-navy-800" />
                  <span>F. Score Breakdown ({result.user_priority} Priority Weights)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Exact points earned versus category maximum points based on active priority weighting vector:
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                Sum: {primary.total_score} / 100.0
              </span>
            </div>

            {/* Visual Progress Bars for each dimension */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Barrier */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Barrier Suitability</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.barrier.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-navy-800 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.barrier.earned_points / scoreBreakdown.barrier.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.barrier.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.barrier.weight_percentage}%</span>
                </div>
              </div>

              {/* Food Compatibility */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Food Compatibility</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.compatibility.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.compatibility.earned_points / scoreBreakdown.compatibility.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.compatibility.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.compatibility.weight_percentage}%</span>
                </div>
              </div>

              {/* Thermal Storage */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Storage Suitability</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.storage.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-cyan-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.storage.earned_points / scoreBreakdown.storage.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.storage.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.storage.weight_percentage}%</span>
                </div>
              </div>

              {/* Mechanical */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Mechanical & Seal</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.mechanical.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.mechanical.earned_points / scoreBreakdown.mechanical.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.mechanical.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.mechanical.weight_percentage}%</span>
                </div>
              </div>

              {/* Cost */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Cost Viability</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.cost.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.cost.earned_points / scoreBreakdown.cost.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.cost.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.cost.weight_percentage}%</span>
                </div>
              </div>

              {/* Sustainability */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-navy-950">Sustainability</span>
                  <span className="font-mono text-navy-800">{scoreBreakdown.sustainability.display}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-forest-700 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scoreBreakdown.sustainability.earned_points / scoreBreakdown.sustainability.max_points) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Raw Score: {scoreBreakdown.sustainability.raw_score}/100</span>
                  <span>Weight: {scoreBreakdown.sustainability.weight_percentage}%</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 6. SECTION H: EXPLAINABILITY ("WHY THIS RECOMMENDATION?") */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-saffron-500" />
              <span>H. Why This Recommendation? — Deterministic Rationale</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Traceability Flow</span>
          </div>

          {/* 6-Stage Visual Pipeline Flow (Requirement 5) */}
          <div className="bg-gradient-to-r from-navy-50 via-slate-50 to-forest-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800 block">
              Deterministic Reasoning & Decision Pipeline
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs font-bold">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-semibold">Stage 1</span>
                <span className="text-navy-950">Food Properties</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-amber-700 font-semibold">Stage 2</span>
                <span className="text-amber-950">Identified Risks</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-blue-700 font-semibold">Stage 3</span>
                <span className="text-blue-950">Packaging Reqs</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-indigo-700 font-semibold">Stage 4</span>
                <span className="text-indigo-950">Candidate Materials</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-emerald-700 font-semibold">Stage 5</span>
                <span className="text-emerald-950">Scoring Engine</span>
              </div>
              <div className="bg-navy-900 text-white p-2.5 rounded-lg border border-navy-950 shadow-xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-saffron-400 font-semibold">Stage 6</span>
                <span className="text-white">Final Recommendation</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Column 1: Main Risks Addressed */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-navy-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-forest-700" />
                <span>1. Risks Addressed</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700">
                {primary.main_risks_addressed && primary.main_risks_addressed.length > 0 ? (
                  primary.main_risks_addressed.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-forest-700 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">Barrier sized to arrest moisture and oxidation ingress.</li>
                )}
              </ul>
            </div>

            {/* Column 2: Key Requirements Met */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-navy-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>2. Requirements Satisfied</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700">
                {primary.key_requirements_met && primary.key_requirements_met.length > 0 ? (
                  primary.key_requirements_met.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-700 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">Meets required oxygen and moisture retention specifications.</li>
                )}
              </ul>
            </div>

            {/* Column 3: Realistic Limitations & Engineering Trade-offs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-navy-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-amber-700" />
                <span>3. Engineering Limitations</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700">
                {primary.limitations && primary.limitations.length > 0 ? (
                  primary.limitations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">Standard multi-material post-consumer recycling limitations apply.</li>
                )}
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* 7. SECTION G: TOP ALTERNATIVES DASHBOARD */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-navy-950">G. Top Alternatives</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top candidate substrates evaluated under active {result.user_priority} priority configuration:
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Multi-Criteria Ranked</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankedMaterials.slice(0, 3).map((item) => {
            const isTop = item.rank === 1;
            return (
              <div 
                key={item.material_id}
                className={`bg-white rounded-xl p-5 shadow-2xs space-y-3 relative border ${
                  isTop ? 'border-2 border-navy-900 ring-1 ring-navy-900' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isTop ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    Rank #{item.rank} {isTop ? '• Recommended Primary' : '• Candidate'}
                  </span>
                  <span className="text-sm font-black text-navy-950 font-mono">
                    {item.total_score} <span className="text-xs text-slate-400">/100</span>
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-navy-950">{item.material_name}</h4>
                  <span className="text-[11px] text-slate-500 font-mono block">Code: {item.material_code} • {item.material_type}</span>
                </div>

                {/* Score breakdown mini-line */}
                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Barrier:</span>
                    <strong className="font-mono text-navy-950">{item.score_breakdown?.barrier?.display}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Economy:</span>
                    <strong className="font-mono text-navy-950">{item.score_breakdown?.cost?.display}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Sustainability:</span>
                    <strong className="font-mono text-navy-950">{item.score_breakdown?.sustainability?.display}</strong>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p><strong>Cost Category:</strong> {item.relative_cost_category}</p>
                  <p><strong>Circularity:</strong> {item.sustainability_badge}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. FRESH PRODUCE PROTOCOL & CHILLING HAZARD WARNING (Requirement 7) */}
      {produce && (
        <div className="bg-forest-50/50 rounded-xl border border-forest-200 p-6 space-y-4">
          <div className="border-b border-forest-200 pb-2">
            <h3 className="text-sm font-bold text-forest-950 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-forest-700" />
              <span>Fresh Produce Post-Harvest Respiration & MAP Protocol</span>
            </h3>
            <p className="text-xs text-forest-800">Post-harvest respiration management and physiological gas requirements:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-lg border border-forest-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Respiration Category</span>
              <strong className="text-forest-950">{produce.category_description}</strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-forest-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Equilibrium Gas Mixture</span>
              <strong className="text-forest-950 font-mono">{produce.recommended_gas_mixture}</strong>
            </div>

            <div className="p-3 bg-white rounded-lg border border-forest-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Gas Exchange Requirement</span>
              <span className="text-slate-700 text-[11px] block">{produce.gas_exchange_requirement || produce.packaging_film_guidance}</span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-forest-200">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Recommended Packaging</span>
              <span className="text-forest-950 font-semibold text-[11px] block">{produce.recommended_packaging_type || 'Micro-perforated breathable pouch'}</span>
            </div>
          </div>

          {/* CHILLING SENSITIVITY WARNING (IF APPLICABLE) */}
          {produce.chilling_sensitivity_warning && produce.chilling_sensitivity_warning.includes('CHILLING INJURY') && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-lg text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs uppercase tracking-wider font-extrabold text-rose-950">
                  Physiological Hazard: Chilling Injury Sensitivity Alert
                </strong>
                <span className="text-xs font-medium leading-relaxed">{produce.chilling_sensitivity_warning}</span>
              </div>
            </div>
          )}

          {/* ANAEROBIC ROT WARNING */}
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
            <strong>Anaerobic Hazard: </strong> {produce.anaerobic_warning}
          </div>
        </div>
      )}

      {/* 9. SECTION I: DETERMINISTIC REJECTION AUDIT */}
      {rejected.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>I. Rejected Alternatives ({rejected.length} Materials Disqualified)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Automated deterministic safety rules eliminated these substrates to prevent food spoilage:
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs">
            {rejected.map((r, idx) => (
              <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-navy-950">{r.material_name}</span>
                  <p className="text-slate-600 mt-0.5">{r.reason}</p>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex-shrink-0">
                  {r.rejection_stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. SECTION J: DATA SOURCES & DEMO DATA NOTICE (Requirement 8) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy-800" />
              <span>J. Data Sources / Demo Data Notice</span>
            </h3>
            <p className="text-xs text-slate-500">
              Authoritative academic, ASTM, and government databases backing the packaging barrier classifications:
            </p>
          </div>
          <span className="inline-block px-3 py-1 text-xs font-bold text-amber-900 bg-amber-50 rounded-lg border border-amber-200 font-mono">
            Current dataset: Prototype / DEMO DATA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Primary Material Citation</span>
            <strong className="text-navy-950 block mt-0.5">{primary.material_name}</strong>
            <p className="text-slate-600 mt-1 italic">{primary.source_citation}</p>
            <span className="inline-block mt-2 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Data Status: {primary.data_status}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Scientific Decision-Support Disclaimer</span>
            <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
              {result.scientific_disclaimer}
            </p>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              All baseline properties mapped from ASTM standards, USDA FoodData Central, Robertson (2012), and UC Davis Postharvest Bulletins.
            </p>
          </div>
        </div>
      </div>

      {/* 12. SECTION: RADAR & BAR CHARTS (COLLAPSIBLE) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy-950">Multi-Dimensional Performance & Trade-Off Visualizer</h3>
            <p className="text-xs text-slate-500">6-axis radar comparison and grouped cost vs. barrier analysis</p>
          </div>
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="text-xs font-semibold text-navy-800 hover:text-navy-950 cursor-pointer"
          >
            {showCharts ? 'Hide Visualizations' : 'Show Visualizations'}
          </button>
        </div>

        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <ScoreRadarChart primary={primary} alternatives={alternatives} />
            <CostEcoChart primary={primary} alternatives={alternatives} />
          </div>
        )}
      </div>

      {/* PDF / SPEC SHEET MODAL */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        result={result}
        requestData={requestData}
      />

    </div>
  );
}
