import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, ShieldCheck, Download, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function ReportModal({ isOpen, onClose, result, requestData }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const documentRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !result) return null;

  const primary = result.primary_recommendation;
  const alternatives = result.alternative_materials || [];
  const reqs = result.packaging_requirements || result.calculated_requirements || {};
  const riskProfile = result.risk_profile || {};
  const risks = result.detected_risks || [];
  const rejected = result.rejection_reasons || result.rejected_materials || [];
  const produce = result.fresh_produce_guidance;
  const scoreBreakdown = primary.score_breakdown;

  const queryId = `PACKAI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloading(true);

    try {
      const sanitizedName = (result.commodity_name || 'Food')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      const filename = `PackAI-Spec-${sanitizedName}-${queryId}.pdf`;

      const opt = {
        margin: [8, 8, 8, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(documentRef.current).save();
    } catch (err) {
      console.error('Direct PDF export error, falling back to print dialog:', err);
      // Fallback
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static"
      onClick={(e) => {
        // Close when clicking the outer backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      
      {/* Container simulating A4 document */}
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 sm:my-8 print:my-0 print:border-none print:shadow-none print:rounded-none relative animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Sticky Modal Top Actions (Always visible when scrolling, hidden in Print) */}
        <div className="sticky top-0 z-30 bg-navy-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-400">SIH 26236 Specification Sheet</span>
            <span className="hidden sm:inline text-slate-300 text-xs">• Document Preview</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct PDF Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 disabled:bg-slate-700 text-white text-xs font-bold px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Download PDF directly to your device"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            {/* Clear Close Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm ml-1"
              title="Close Preview (Escape)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Printable & Downloadable Document Body */}
        <div 
          ref={documentRef}
          className="p-6 sm:p-10 space-y-6 text-slate-800 text-xs sm:text-sm print:p-0 print:space-y-4 bg-white"
        >
          
          {/* Header & Logo */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 avoid-break">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">Pack<span className="text-emerald-600">AI</span></span>
                <span className="text-[10px] bg-slate-100 border border-slate-300 text-slate-700 font-bold px-2 py-0.5 rounded">
                  SIH Problem Statement 26236
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                Food Packaging Material Specification & Audit Report
              </h1>
              <p className="text-[11px] text-slate-500">
                AI-Based Intelligent Food Packaging Recommendation System for Food Commodities
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p><strong>Report Ref:</strong> {queryId}</p>
              <p><strong>Generated:</strong> {dateFormatted}</p>
              <p><strong>Optimization:</strong> {result.user_priority}</p>
            </div>
          </div>

          {/* Section 1: Food Commodity Profile */}
          <div className="space-y-2 avoid-break">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
              1. Food Commodity Profile & Storage Context
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Food Commodity</span>
                <span className="font-bold text-slate-900 text-xs">{result.commodity_name}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Moisture Content</span>
                <span className="font-bold text-slate-900 text-xs">{requestData?.moisture_content_percent}%</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Fat / Lipid Content</span>
                <span className="font-bold text-slate-900 text-xs">{requestData?.fat_content_percent}%</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Acidity (pH)</span>
                <span className="font-bold text-slate-900 text-xs">pH {requestData?.ph_value}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Shelf Life</span>
                <span className="font-bold text-emerald-800 text-xs">{requestData?.desired_shelf_life_days} Days</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Storage Channel</span>
                <span className="font-bold text-slate-900 text-xs">{requestData?.storage_type} ({requestData?.storage_temperature_c}°C)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Ambient Humidity</span>
                <span className="font-bold text-slate-900 text-xs">{requestData?.relative_humidity_percent}% RH</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Logistics Mode</span>
                <span className="font-bold text-slate-900 text-xs">{requestData?.transportation_condition}</span>
              </div>
            </div>

            {/* Qualitative Risk Profile Grid */}
            {riskProfile && Object.keys(riskProfile).length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Qualitative Degradation Risk Profile:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-[10px]">
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Moisture</span>
                    <strong>{riskProfile.moisture_risk || 'MEDIUM'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Oxygen</span>
                    <strong>{riskProfile.oxygen_risk || 'MEDIUM'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Light</span>
                    <strong>{riskProfile.light_risk || 'LOW'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Fat/Oil</span>
                    <strong>{riskProfile.fat_oil_risk || 'LOW'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Thermal</span>
                    <strong>{riskProfile.temperature_risk || 'LOW'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Transit</span>
                    <strong>{riskProfile.mechanical_risk || 'LOW'}</strong>
                  </div>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block text-[9px]">Respiration</span>
                    <strong>{riskProfile.respiration_required ? 'REQUIRED' : 'NONE'}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Calculated Barrier Requirements */}
          <div className="space-y-2 avoid-break">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
              2. Sized Packaging Barrier & Performance Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium block">Oxygen Barrier Tier</span>
                <strong className="text-slate-900 text-xs">{reqs.required_oxygen_barrier?.replace('_', ' ')}</strong>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium block">Moisture Barrier Tier</span>
                <strong className="text-slate-900 text-xs">{reqs.required_moisture_barrier?.replace('_', ' ')}</strong>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium block">Light Shielding</span>
                <strong className="text-slate-900 text-xs">{reqs.required_light_barrier}</strong>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium block">Mechanical Resilience</span>
                <strong className="text-slate-900 text-xs">{reqs.required_mechanical_strength}</strong>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 font-medium block">Heat Seal Integrity</span>
                <strong className="text-slate-900 text-xs">{reqs.required_sealability}</strong>
              </div>
            </div>
          </div>

          {/* Section 3: Recommended Primary Packaging Material */}
          <div className="space-y-2 avoid-break">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
              3. Recommended Primary Packaging Solution
            </h2>
            
            <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase">{primary.material_type} • Code: {primary.material_code}</span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">{primary.material_name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right max-w-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Prototype Compatibility Score</span>
                    <span className="text-lg font-black text-emerald-700">{primary.total_score} / 100</span>
                    <p className="text-[9px] text-slate-500 italic leading-tight mt-0.5">
                      This is an algorithmic decision-support score based on configured prototype criteria and is not a laboratory-validated performance rating.
                    </p>
                  </div>
                </div>
              </div>

              {/* Layer Stack Table */}
              {primary.layers && primary.layers.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Calibrated Layer Configuration:</span>
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2">Layer Ply</th>
                        <th className="p-2">Substrate Name</th>
                        <th className="p-2 text-center">Thickness (µm)</th>
                        <th className="p-2">Engineering Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {primary.layers.map((l, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono text-slate-500">Ply {idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{l.layer_name}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">{l.typical_thickness_microns} µm</td>
                          <td className="p-2 text-slate-600">{l.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Explainable Rationale */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">Engineering & Preservation Rationale:</span>
                <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                  {primary.why_selected.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Dynamic Algorithmic Score Breakdown Table */}
              {scoreBreakdown && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Multi-Criteria Algorithmic Scoring Breakdown ({result.user_priority} Priority):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Barrier</span>
                      <strong className="text-slate-900">{scoreBreakdown.barrier.display}</strong>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Compatibility</span>
                      <strong className="text-slate-900">{scoreBreakdown.compatibility.display}</strong>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Storage</span>
                      <strong className="text-slate-900">{scoreBreakdown.storage.display}</strong>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Mechanical</span>
                      <strong className="text-slate-900">{scoreBreakdown.mechanical.display}</strong>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Cost</span>
                      <strong className="text-slate-900">{scoreBreakdown.cost.display}</strong>
                    </div>
                    <div className="p-1.5 bg-white border border-slate-200 rounded">
                      <span className="text-slate-400 block text-[9px]">Sustainability</span>
                      <strong className="text-slate-900">{scoreBreakdown.sustainability.display}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between text-[11px] text-slate-500">
                <span><strong>Eco Classification:</strong> {primary.sustainability_badge}</span>
                <span><strong>Relative Cost:</strong> {primary.relative_cost_category}</span>
                <span><strong>Citation Source:</strong> {primary.source_citation}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Fresh Produce Protocol (if applicable) */}
          {produce && (
            <div className="space-y-2 avoid-break">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
                4. Fresh Produce Respiration & Modified Atmosphere (MAP) Protocol
              </h2>
              <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50 text-xs space-y-1.5">
                <p><strong>Respiration Category:</strong> {produce.category_description}</p>
                <p><strong>Equilibrium Gas Mixture:</strong> <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">{produce.recommended_gas_mixture}</code></p>
                <p><strong>Breathability Guidance:</strong> {produce.gas_exchange_requirement || produce.packaging_film_guidance}</p>
                <p><strong>Recommended Packaging:</strong> {produce.recommended_packaging_type || 'Micro-perforated breathable pouch'}</p>
                <p><strong>Condensation Control:</strong> {produce.condensation_control}</p>
                
                {produce.chilling_sensitivity_warning && produce.chilling_sensitivity_warning.includes('CHILLING INJURY') && (
                  <p className="text-rose-900 font-bold bg-rose-100 p-2 rounded border border-rose-200">
                    {produce.chilling_sensitivity_warning}
                  </p>
                )}

                <p className="text-rose-900 font-semibold">{produce.anaerobic_warning}</p>
              </div>
            </div>
          )}

          {/* Section 5: Alternative Materials & Rejection Audit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 avoid-break">
            
            {/* Alternatives */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
                5. Viable Alternative Materials
              </h2>
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <div key={alt.material_id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-center font-bold text-xs">
                      <span>{alt.material_name}</span>
                      <span className="text-emerald-700">{alt.total_score}/100</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">{alt.sustainability_badge} • Cost: {alt.relative_cost_category}</span>
                    <p className="text-[11px] text-slate-600 mt-1">{alt.why_selected[0]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection Audit */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-md">
                6. Compatibility Rejection Audit
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto print:max-h-none">
                {rejected.length > 0 ? (
                  rejected.map((r, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                      <span className="font-bold text-slate-900">{r.material_name}</span>
                      <span className="text-[10px] text-rose-700 block font-semibold">[{r.rejection_stage}]</span>
                      <p className="text-slate-600 mt-0.5">{r.reason}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">All evaluated materials met baseline compatibility thresholds.</p>
                )}
              </div>
            </div>

          </div>

          {/* Section 6: Governance & Disclaimer */}
          <div className="border-t-2 border-slate-200 pt-4 space-y-2 avoid-break">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <strong>Mandatory Scientific Integrity Disclaimer:</strong>
              <p className="mt-0.5 text-[11px] text-amber-800 leading-relaxed">
                This prototype provides decision support based on available food chemistry, qualitative barrier categories, and post-harvest physiology data. Packaging selection for commercial production must be validated by qualified food-packaging professionals and appropriate laboratory barrier testing (ASTM D3985 / ASTM F1249). All prototype records are tagged DEMO DATA until certified against accredited laboratory trials.
              </p>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
              <span>PackAI Prototype • Smart India Hackathon (SIH) 2026</span>
              <span>Page 1 of 1</span>
            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Actions (Hidden in Print) */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 text-slate-800 rounded">Esc</kbd> or click Close to return to results dashboard.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-sm flex-1 sm:flex-none"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex-1 sm:flex-none"
            >
              <X className="w-4 h-4" />
              <span>Close Window</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
