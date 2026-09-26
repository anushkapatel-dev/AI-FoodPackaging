import React from 'react';
import { ShieldCheck, Package } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 text-slate-600 text-xs">
      
      {/* Top subtle tricolor stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-saffron-500 via-slate-200 to-forest-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-navy-900 flex items-center justify-center text-white">
                <Package className="w-4 h-4 text-saffron-400" />
              </div>
              <span className="font-extrabold text-navy-950 text-base">Pack<span className="text-navy-700">AI</span></span>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded border border-slate-200">
                SIH 26236 Prototype
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              AI-Based Intelligent Food Packaging Material Recommendation System for Food Commodities. 
              Engineered as an institutional decision-support system for food industries, farmers, startups, and researchers.
            </p>
            <div className="flex items-center gap-1.5 text-forest-800 font-semibold bg-forest-50 px-2.5 py-1 rounded border border-forest-200 w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
              <span>Zero-Fabrication Scientific Data Standard</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-navy-950 uppercase tracking-wider mb-2.5">Academic & Technical Citations</h4>
            <ul className="space-y-1.5 text-slate-500">
              <li>• Robertson, G.L. (2012) — <em>Food Packaging: Principles and Practice</em></li>
              <li>• UC Davis Postharvest Technology Center Produce Protocols</li>
              <li>• ASTM D3985 & ASTM F1249 Gas/Vapor Permeation Standards</li>
              <li>• USDA FoodData Central Foundation Nutrient Tables</li>
              <li>• Codex Alimentarius International Standards for Food Safety</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-navy-950 uppercase tracking-wider mb-2.5">System Architecture</h4>
            <div className="space-y-1.5 text-slate-500">
              <p><span className="font-semibold text-slate-700">Backend:</span> FastAPI + SQLite + Rule Inference Engine</p>
              <p><span className="font-semibold text-slate-700">Frontend:</span> React 18 + Vite + Tailwind CSS + Recharts</p>
              <p><span className="font-semibold text-slate-700">Data Status:</span> Conservative baseline labeled DEMO DATA</p>
              <p><span className="font-semibold text-slate-700">Compliance:</span> SIH 26236 Technical Specification Ready</p>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between text-slate-400 gap-3">
          <p>© 2026 PackAI Prototype. Developed for SIH Problem Statement 26236.</p>
          <p className="text-center sm:text-right">Decision-support system for educational and prototype demonstration purposes.</p>
        </div>
      </div>
    </footer>
  );
}
