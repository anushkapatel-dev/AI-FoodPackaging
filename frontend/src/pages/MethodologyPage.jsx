import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Scale, 
  AlertTriangle, 
  Layers, 
  Award, 
  Cpu, 
  Database, 
  CheckCircle2,
  ArrowDown
} from 'lucide-react';

export default function MethodologyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800">Technical Documentation • SIH 26236</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Methodology & Scientific Integrity Framework</h1>
        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
          Detailed technical documentation of the algorithmic pipeline, compatibility screening logic, weighting matrices, database provenance, and zero-fabrication standards.
        </p>
      </div>

      {/* Visual Workflow Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-navy-950">Visual Decision-Support Pipeline</h2>
          <p className="text-xs text-slate-500">End-to-end algorithmic flow from user entry to auditable recommendation:</p>
        </div>

        <div className="max-w-md mx-auto space-y-2 text-center text-xs">
          
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-navy-950">
            1. USER INPUT (Commodity, Moisture %, Fat %, pH, Storage, Transit)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-navy-950">
            2. FOOD RISK ANALYSIS (Crispness loss, lipid oxidation rancidity, acid attack, transit stress)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-navy-950">
            3. PACKAGING REQUIREMENT CALCULATION (OTR tier, WVTR tier, light shielding, seal integrity)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 font-bold text-amber-950">
            4. MATERIAL COMPATIBILITY FILTER (Eliminates thermal, produce choking, or oil failures)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-bold text-navy-950">
            5. WEIGHTED SCORING (Dynamic priority scoring across 6 evaluation criteria, 0–100 scale)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-forest-50 rounded-lg border border-forest-200 font-bold text-forest-950">
            6. RECOMMENDATION (Selects Primary Laminate, Sustainable Alternative, & Budget Alternative)
          </div>

          <div className="flex justify-center text-navy-700">
            <ArrowDown className="w-4 h-4" />
          </div>

          <div className="p-3 bg-navy-900 text-white rounded-lg border border-navy-950 font-bold">
            7. EXPLANATION + SOURCES (Explainable rationale, 2D cross-section, & literature citations)
          </div>

        </div>
      </section>

      {/* Section 1: Scientific Integrity Policy */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Scientific Governance Policy</span>
        </div>
        <h2 className="text-base font-bold text-navy-950">Zero-Fabrication Data Standard</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          In strict accordance with scientific integrity guidelines, this prototype <strong>refuses to invent pseudo-scientific numerical OTR (Oxygen Transmission Rate) or WVTR (Water Vapor Transmission Rate) values</strong>. 
          Real-world permeation rates vary widely based on relative humidity gradients, activation temperatures, plasticizer content, and film orientation.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          The prototype standardizes around verified <strong>qualitative barrier tiers</strong> (<code className="text-[11px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">VERY_LOW</code>, <code className="text-[11px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">LOW</code>, <code className="text-[11px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">MEDIUM</code>, <code className="text-[11px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">HIGH</code>, <code className="text-[11px] font-mono font-bold bg-slate-100 px-1 py-0.5 rounded">VERY_HIGH</code>) derived from peer-reviewed literature. All unverified database records remain explicitly marked <code className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-1 py-0.5 rounded">DEMO DATA</code> until calibrated via ASTM D3985 / ASTM F1249 laboratory trials.
        </p>
      </section>

      {/* Section 2: Priority Weighting Matrix */}
      <section id="technical" className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-navy-800">
          <Scale className="w-4 h-4" />
          <span>Scoring Architecture</span>
        </div>
        <h2 className="text-base font-bold text-navy-950">Multi-Criteria Priority Weighting Matrix</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Eligible materials that survive deterministic safety filtering receive a score from 0 to 100 based on the user's strategic optimization priority:
        </p>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Evaluation Criterion</th>
                <th className="py-2.5 px-4 text-center">Balanced (Default)</th>
                <th className="py-2.5 px-4 text-center">Cost Priority</th>
                <th className="py-2.5 px-4 text-center">Sustainability</th>
                <th className="py-2.5 px-4 text-center">Max Barrier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Barrier Suitability (O2, Moisture, Light)</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-navy-900">35%</td>
                <td className="py-2.5 px-4 text-center font-mono">25%</td>
                <td className="py-2.5 px-4 text-center font-mono">25%</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-navy-900">50%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Food-Material Chemical Compatibility</td>
                <td className="py-2.5 px-4 text-center font-mono">20%</td>
                <td className="py-2.5 px-4 text-center font-mono">15%</td>
                <td className="py-2.5 px-4 text-center font-mono">15%</td>
                <td className="py-2.5 px-4 text-center font-mono">20%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Storage & Temperature Suitability</td>
                <td className="py-2.5 px-4 text-center font-mono">15%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">15%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Mechanical Resilience & Sealability</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Cost Viability Score</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-navy-900">30%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">2.5%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-navy-950">Circular Sustainability & Biodegradability</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono">10%</td>
                <td className="py-2.5 px-4 text-center font-mono font-bold text-forest-800">30%</td>
                <td className="py-2.5 px-4 text-center font-mono">2.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3: Database & Evidence Architecture */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-navy-800">
          <Database className="w-4 h-4" />
          <span>Data Provenance</span>
        </div>
        <h2 className="text-base font-bold text-navy-950">Evidence Status Tiers</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every scientific property and database record in PackAI is labeled with one of three transparent status indicators:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="font-mono font-bold text-emerald-900 block">[VERIFIED]</span>
            <p className="text-emerald-800 mt-1 text-[11px]">
              Directly cross-referenced against standardized laboratory protocols, ASTM test standards, or official USDA FoodData Central databases.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <span className="font-mono font-bold text-amber-900 block">[DEMO DATA]</span>
            <p className="text-amber-800 mt-1 text-[11px]">
              Conservative qualitative representative data derived from peer-reviewed packaging handbooks; pending primary commercial laboratory certification.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono font-bold text-slate-800 block">[NEEDS REVIEW]</span>
            <p className="text-slate-600 mt-1 text-[11px]">
              Novel bio-polymer or experimental mono-material requiring localized supply-chain barrier validation.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Academic & Standards Citations */}
      <section id="about" className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-navy-800">
          <BookOpen className="w-4 h-4" />
          <span>Academic References</span>
        </div>
        <h2 className="text-base font-bold text-navy-950">Authoritative Literature Citations</h2>
        
        <div className="space-y-3 text-xs text-slate-700">
          
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-navy-950 block">Primary Packaging Engineering Reference:</strong>
            <p className="text-slate-600 mt-0.5">
              Robertson, Gordon L. (2012). <em>Food Packaging: Principles and Practice</em> (3rd ed.). CRC Press, Taylor & Francis Group.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-navy-950 block">Produce Respiration & MAP Kinetics:</strong>
            <p className="text-slate-600 mt-0.5">
              University of California Davis Postharvest Technology Center. <em>Produce Fact Sheets & Modified Atmosphere Packaging Protocols</em>.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-navy-950 block">Nutrient Composition & Food Chemistry:</strong>
            <p className="text-slate-600 mt-0.5">
              United States Department of Agriculture (USDA) Agricultural Research Service, FoodData Central Foundation Database.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <strong className="text-navy-950 block">Polymer Barrier Testing Standards:</strong>
            <p className="text-slate-600 mt-0.5">
              ASTM D3985 (Coulometric Oxygen Transmission Rate) & ASTM F1249 (Modulated Infrared Water Vapor Transmission Rate).
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
