import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Layers, 
  ArrowLeft, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Scale, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { getMaterials, compareMaterials } from '../services/api';

export default function ComparePage() {
  const location = useLocation();
  const [allMaterials, setAllMaterials] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparedData, setComparedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  // Initialize selected IDs from location state or defaults
  useEffect(() => {
    getMaterials()
      .then((mats) => {
        setAllMaterials(mats);
        
        let initialIds = [1, 6, 8]; // Default: LDPE, Met-BOPP, Alu Laminate
        if (location.state?.materialIds && location.state.materialIds.length >= 2) {
          initialIds = location.state.materialIds.slice(0, 4);
        }
        setSelectedIds(initialIds);
        fetchComparison(initialIds);
      })
      .catch((err) => {
        console.error("Error fetching materials:", err);
        setError("Failed to load materials catalog.");
      })
      .finally(() => setLoading(false));
  }, [location.state]);

  const fetchComparison = async (ids) => {
    if (ids.length < 2) return;
    setComparing(true);
    setError(null);
    try {
      const res = await compareMaterials(ids);
      setComparedData(res.materials);
    } catch (err) {
      console.error("Comparison request failed:", err);
      setError("Failed to retrieve material comparison data.");
    } finally {
      setComparing(false);
    }
  };

  const toggleMaterial = (id) => {
    let nextIds;
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert("You must select at least 2 materials to compare.");
        return;
      }
      nextIds = selectedIds.filter((item) => item !== id);
    } else {
      if (selectedIds.length >= 4) {
        alert("Maximum 4 materials can be compared simultaneously.");
        return;
      }
      nextIds = [...selectedIds, id];
    }
    setSelectedIds(nextIds);
    fetchComparison(nextIds);
  };

  const getBarrierColor = (level) => {
    switch (level) {
      case 'VERY_HIGH': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'HIGH': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <Link to="/materials" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Materials Registry</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Side-by-Side Material Comparison</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Compare 2 to 4 packaging films or laminate structures across qualitative barriers, mechanical limits, qualitative temperature suitability, relative cost, and circular sustainability.
        </p>
      </div>

      {/* Material Selector Checkbox Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Materials to Compare ({selectedIds.length}/4 Selected)
          </span>
          <span className="text-[11px] text-slate-400">Select 2 to 4 substrates</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {allMaterials.map((mat) => {
            const isSelected = selectedIds.includes(mat.id);
            return (
              <button
                key={mat.id}
                type="button"
                onClick={() => toggleMaterial(mat.id)}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="truncate">{mat.material_code}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Matrix Table */}
      {comparing ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold">Generating Comparison Matrix...</p>
        </div>
      ) : comparedData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-slate-400 uppercase font-bold text-[10px] tracking-wider w-44">Parameter</th>
                  {comparedData.map((m) => (
                    <th key={m.id} className="p-4 text-slate-900 font-extrabold text-sm border-l border-slate-200 min-w-56">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {m.material_code}
                        </span>
                        <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {m.data_status}
                        </span>
                      </div>
                      <span className="block">{m.name}</span>
                      <span className="text-[11px] font-normal text-slate-400 block mt-0.5">{m.material_type}</span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Oxygen Barrier */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Oxygen Barrier</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100">
                      <span className={`px-2 py-0.5 rounded border font-bold ${getBarrierColor(m.oxygen_barrier)}`}>
                        {m.oxygen_barrier.replace('_', ' ')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Moisture Barrier */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Moisture Barrier</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100">
                      <span className={`px-2 py-0.5 rounded border font-bold ${getBarrierColor(m.moisture_barrier)}`}>
                        {m.moisture_barrier.replace('_', ' ')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Light Barrier */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Light / UV Barrier</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-semibold text-slate-800">
                      {m.light_barrier}
                    </td>
                  ))}
                </tr>

                {/* Mechanical Strength */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Mechanical Strength</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-semibold text-slate-800">
                      {m.mechanical_strength}
                    </td>
                  ))}
                </tr>

                {/* Sealability */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Heat Seal Integrity</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-semibold text-slate-800">
                      {m.sealability}
                    </td>
                  ))}
                </tr>

                {/* Fat / Oil Resistance */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Fat / Oil Resistance</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-semibold text-slate-800">
                      {m.fat_oil_resistance}
                    </td>
                  ))}
                </tr>

                {/* Qualitative Temperature Suitability */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Temperature Suitability (Qualitative)</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-medium text-slate-800">
                      {m.storage_compatibility}
                    </td>
                  ))}
                </tr>

                {/* Recyclability & Eco */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Recyclability / Circular</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100">
                      <span className="font-semibold text-emerald-700 block">{m.recyclability.replace('_', ' ')}</span>
                      {m.biodegradability && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                          Biodegradable / Compostable
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Cost Category */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Relative Cost Category</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 font-semibold text-blue-700">
                      {m.relative_cost_category} ({m.relative_cost_index}x Index)
                    </td>
                  ))}
                </tr>

                {/* Layer Stack */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Layer Structure</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100">
                      {m.layers && m.layers.length > 0 ? (
                        <div className="space-y-1">
                          {m.layers.map((l, idx) => (
                            <div key={idx} className="text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="font-bold text-slate-800 block">{l.layer_name} ({l.typical_thickness_microns}µm)</span>
                              <span className="text-[10px] text-slate-500">{l.purpose}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Single substrate film</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Source Citation */}
                <tr>
                  <td className="p-4 font-bold text-slate-900 bg-slate-50/50">Authority Citation</td>
                  {comparedData.map((m) => (
                    <td key={m.id} className="p-4 border-l border-slate-100 text-[10px] text-slate-500 italic">
                      {m.source_citation}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>
        </div>
      ) : null}

    </div>
  );
}
