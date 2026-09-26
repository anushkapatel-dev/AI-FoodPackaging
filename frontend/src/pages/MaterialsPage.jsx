import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Layers, 
  Search, 
  Filter, 
  Check, 
  Scale, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  X,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { getMaterials } from '../services/api';

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [activeDetailMaterial, setActiveDetailMaterial] = useState(null);

  useEffect(() => {
    getMaterials()
      .then((data) => setMaterials(data))
      .catch((err) => {
        console.error("Error fetching materials catalog:", err);
        setError("Failed to load materials catalog.");
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCompare = (id) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length >= 4) {
        alert("Maximum 4 substrates can be compared at once.");
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const handleCompareClick = () => {
    if (selectedForCompare.length < 2) {
      alert("Please select at least 2 substrates to compare.");
      return;
    }
    navigate('/compare', { state: { materialIds: selectedForCompare } });
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.material_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.material_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'MONO') return m.material_type === 'Mono-Polymer';
    if (selectedFilter === 'LAMINATE') return m.material_type.includes('Laminate') || m.material_type.includes('Multi-Layer');
    if (selectedFilter === 'BIO') return m.biodegradability || m.recyclability.includes('COMPOST');
    if (selectedFilter === 'BREATHABLE') return m.is_breathable;

    return true;
  });

  const getBarrierBadgeColor = (level) => {
    switch (level) {
      case 'VERY_HIGH': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'HIGH': return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'MEDIUM': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800">Verified Technical Database • SIH 26236</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Packaging Materials Catalog</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curated database of 12 food packaging films and laminates with literature provenance citations.
          </p>
        </div>

        {/* Comparison Floating Action */}
        <div className="flex items-center gap-2">
          {selectedForCompare.length > 0 && (
            <button
              onClick={handleCompareClick}
              disabled={selectedForCompare.length < 2}
              className="inline-flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-saffron-400" />
              <span>Compare Selected ({selectedForCompare.length}/4)</span>
            </button>
          )}

          <Link
            to="/wizard"
            className="inline-flex items-center gap-1.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <span>Run Recommendation Wizard</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, polymer, or substrate type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-800"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All (12)' },
              { id: 'MONO', label: 'Mono-Polymers' },
              { id: 'LAMINATE', label: 'Multilayer Laminates' },
              { id: 'BIO', label: 'Bio / Compostable' },
              { id: 'BREATHABLE', label: 'Produce Breathable' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => {
          const isSelected = selectedForCompare.includes(mat.id);
          return (
            <div
              key={mat.id}
              className={`bg-white rounded-xl border p-5 transition-all flex flex-col justify-between shadow-2xs ${
                isSelected ? 'border-navy-900 ring-1 ring-navy-900' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                
                {/* Header row: Code, Type & Compare Checkbox */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-xs font-mono font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                      {mat.material_code}
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                      {mat.material_type}
                    </span>
                  </div>

                  <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCompare(mat.id)}
                      className="w-3.5 h-3.5 rounded text-navy-900 focus:ring-navy-900"
                    />
                    <span>Compare</span>
                  </label>
                </div>

                {/* Substrate Title */}
                <h3 className="font-bold text-sm text-navy-950 leading-snug">
                  {mat.name}
                </h3>

                {/* Key Qualitative Properties Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Oxygen Barrier</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${getBarrierBadgeColor(mat.oxygen_barrier)}`}>
                      {mat.oxygen_barrier.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Moisture Barrier</span>
                    <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${getBarrierBadgeColor(mat.moisture_barrier)}`}>
                      {mat.moisture_barrier.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Light Barrier</span>
                    <strong className="text-[11px] text-navy-950 block mt-0.5">{mat.light_barrier}</strong>
                  </div>

                  <div className="p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Heat Sealability</span>
                    <strong className="text-[11px] text-navy-950 block mt-0.5">{mat.sealability}</strong>
                  </div>
                </div>

                {/* Relative Cost & Eco Indicator */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    Cost: <strong className="text-navy-950">{mat.relative_cost_category}</strong>
                  </span>
                  <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                    {mat.biodegradability ? 'Bio-Compostable' : mat.recyclability.replace('_', ' ')}
                  </span>
                </div>

              </div>

              {/* Card Footer: Evidence Status & View Technical Details */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {mat.data_status}
                </span>

                <button
                  type="button"
                  onClick={() => setActiveDetailMaterial(mat)}
                  className="text-xs font-bold text-navy-900 hover:text-navy-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Technical Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* TECHNICAL DETAILS MODAL */}
      {activeDetailMaterial && (
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveDetailMaterial(null);
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in-95 duration-100">
            
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-navy-800 uppercase bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
                  {activeDetailMaterial.material_code} • {activeDetailMaterial.material_type}
                </span>
                <h3 className="text-lg font-bold text-navy-950 mt-1">{activeDetailMaterial.name}</h3>
              </div>
              <button
                onClick={() => setActiveDetailMaterial(null)}
                className="text-slate-400 hover:text-navy-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Oxygen Barrier</span>
                <strong className="text-navy-950">{activeDetailMaterial.oxygen_barrier.replace('_', ' ')}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Moisture Barrier</span>
                <strong className="text-navy-950">{activeDetailMaterial.moisture_barrier.replace('_', ' ')}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Light Shielding</span>
                <strong className="text-navy-950">{activeDetailMaterial.light_barrier}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Mechanical Strength</span>
                <strong className="text-navy-950">{activeDetailMaterial.mechanical_strength}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Seal Integrity</span>
                <strong className="text-navy-950">{activeDetailMaterial.sealability}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Temperature Suitability</span>
                <strong className="text-navy-950">{activeDetailMaterial.storage_compatibility}</strong>
              </div>
            </div>

            {/* Layer Stack Table */}
            {activeDetailMaterial.layers && activeDetailMaterial.layers.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-navy-950 block">Calibrated Layer Stack:</span>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">Ply</th>
                      <th className="p-2">Substrate Ply</th>
                      <th className="p-2 text-center">Thickness (µm)</th>
                      <th className="p-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDetailMaterial.layers.map((l, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-2 font-mono text-slate-400">Ply {idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{l.layer_name}</td>
                        <td className="p-2 text-center font-mono font-bold text-navy-900">{l.typical_thickness_microns} µm</td>
                        <td className="p-2 text-slate-600">{l.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Suitable Food Commodities & Citation */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="font-bold text-slate-700">Suitable Food Commodities:</span>
                <p className="text-slate-600 mt-0.5">{activeDetailMaterial.suitable_food_categories || 'General shelf-stable food matrices'}</p>
              </div>
              <div>
                <span className="font-bold text-slate-700">Academic Literature Citation:</span>
                <p className="text-slate-500 italic mt-0.5">{activeDetailMaterial.source_citation}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveDetailMaterial(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
