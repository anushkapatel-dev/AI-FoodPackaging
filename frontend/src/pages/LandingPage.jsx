import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Leaf, 
  BookOpen, 
  ArrowRight,
  Droplets,
  Flame,
  FileCheck2,
  Package
} from 'lucide-react';
import { getHealth } from '../services/api';

export default function LandingPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealth()
      .then((data) => setHealth(data))
      .catch((err) => console.error("Health check error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl space-y-5">
            
            {/* System Status & Problem Statement Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${health?.database_connected ? 'bg-forest-500' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${health?.database_connected ? 'bg-forest-600' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-navy-950 font-bold">Decision Support Core:</span>
              <span>{health ? `${health.total_materials} Materials / ${health.total_commodities} Preset Commodities Loaded` : 'Connecting...'}</span>
              <span className="text-slate-300">•</span>
              <span className="text-navy-800 font-bold">SIH 26236</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy-950 tracking-tight leading-tight">
              AI-Based Intelligent Food Packaging Material Recommendation System
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              An intelligent decision-support platform that recommends suitable food packaging materials based on food properties, storage conditions, transportation requirements and sustainability priorities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/wizard"
                className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm px-6 py-3 rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4 text-saffron-400" />
                <span>Start Recommendation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/materials"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 py-3 rounded-lg border border-slate-300 shadow-2xs transition-colors"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Explore Materials</span>
              </Link>
            </div>

            {/* Institutional Compliance Indicators & Demo Notice */}
            <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Current Dataset: Prototype / DEMO DATA</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Deterministic Scoring Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Fresh Produce MAP & Respiration Mode</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 italic">
                <span>Not a laboratory-validated performance rating</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4 Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center text-navy-900 mb-3 border border-navy-100">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-950">Intelligent Evaluation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent, rule-based inference analyzing food chemistry, lipid oxidation risks, and ambient humidity gradients.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center text-navy-900 mb-3 border border-navy-100">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-950">Packaging Compatibility</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated safety rules filtering out thermal mismatches, acid corrosion risks, and anaerobic asphyxiation for produce.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-forest-50 flex items-center justify-center text-forest-700 mb-3 border border-forest-100">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-950">Sustainability Analysis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Assesses mono-material recyclability streams, multilayer complexity, and certified compostable bio-polymers.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="w-9 h-9 rounded-lg bg-saffron-50 flex items-center justify-center text-saffron-700 mb-3 border border-saffron-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-navy-950">Evidence & Sources</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              All substrate records cite recognized handbooks (Robertson 2012, USDA, UC Davis) with explicit DEMO DATA labeling.
            </p>
          </div>

        </div>
      </section>

      {/* Simple 4-Step Visual Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800 block">End-to-End Decision Architecture</span>
              <h2 className="text-xl font-bold text-navy-950">Recommendation Flow</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                A simple 4-step decision-support sequence converting commodity inputs into optimal packaging:
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
              Decision Support • Not Lab Tested
            </span>
          </div>

          {/* 4-Step Stepped Horizontal Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            
            {/* Step 1: Food Properties */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <Droplets className="w-4 h-4 text-navy-600" />
              </div>
              <h4 className="font-bold text-xs text-navy-950 uppercase tracking-wider">Food Properties</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Inputs moisture %, lipid fat %, pH, respiration category, and storage temperature.
              </p>
              <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                Step 1: Input Specification
              </div>
            </div>

            {/* Step 2: Risk Analysis */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="font-bold text-xs text-navy-950 uppercase tracking-wider">Risk Analysis</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Evaluates crispness loss, oxidative rancidity, light decay, acid attack, and freight vibration.
              </p>
              <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                Step 2: Biochemical Hazards
              </div>
            </div>

            {/* Step 3: Packaging Evaluation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <Layers className="w-4 h-4 text-blue-700" />
              </div>
              <h4 className="font-bold text-xs text-navy-950 uppercase tracking-wider">Packaging Evaluation</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Deduces required OTR, WVTR, light block, seal strength, and filters out incompatible films.
              </p>
              <div className="text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200/60">
                Step 3: Multi-Criteria Rules
              </div>
            </div>

            {/* Step 4: Intelligent Recommendation */}
            <div className="bg-navy-900 text-white p-4 rounded-xl border border-navy-950 relative space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-saffron-500 text-navy-950 text-xs font-bold flex items-center justify-center">4</span>
                <FileCheck2 className="w-4 h-4 text-saffron-400" />
              </div>
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Intelligent Recommendation</h4>
              <p className="text-[11px] text-navy-200 leading-relaxed">
                Ranked material, 2D layer cross-section, score breakdown, circular alternatives, and spec sheet.
              </p>
              <div className="text-[10px] text-saffron-300 font-semibold pt-1 border-t border-navy-800">
                Step 4: Output Specification
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Preset Commodity Test Case Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-navy-950">Preset Evaluation Case Studies</h3>
              <p className="text-xs text-slate-500">Test pre-configured food commodities representing diverse post-harvest challenges</p>
            </div>
            <Link to="/wizard" className="text-xs font-bold text-navy-800 hover:text-navy-950 inline-flex items-center gap-1">
              <span>Open in Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            
            <Link
              to="/wizard"
              className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-navy-400 transition-colors block text-left"
            >
              <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit mb-1 border border-amber-200">
                High-Fat Dry Snack
              </div>
              <div className="font-bold text-xs text-navy-950">Potato Chips</div>
              <p className="text-[11px] text-slate-500 mt-1">34.5% fat, 1.8% moisture. Needs UV & O2 barrier for rancidity prevention.</p>
            </Link>

            <Link
              to="/wizard"
              className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-navy-400 transition-colors block text-left"
            >
              <div className="text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded w-fit mb-1 border border-forest-200">
                Fresh Produce
              </div>
              <div className="font-bold text-xs text-navy-950">Fresh Strawberries</div>
              <p className="text-[11px] text-slate-500 mt-1">High respiration produce. MAP & breathable micro-perforation protocol.</p>
            </Link>

            <Link
              to="/wizard"
              className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-navy-400 transition-colors block text-left"
            >
              <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded w-fit mb-1 border border-blue-200">
                Cold Chain Dairy
              </div>
              <div className="font-bold text-xs text-navy-950">Raw Paneer</div>
              <p className="text-[11px] text-slate-500 mt-1">54% moisture, 22% fat. Mold prevention via CO2/N2 gas barrier.</p>
            </Link>

            <Link
              to="/wizard"
              className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-navy-400 transition-colors block text-left"
            >
              <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded w-fit mb-1 border border-rose-200">
                Acidic Liquid / Sauce
              </div>
              <div className="font-bold text-xs text-navy-950">Tomato Puree</div>
              <p className="text-[11px] text-slate-500 mt-1">pH 4.1 acidity. Demands chemically inert polyolefin contact layer.</p>
            </Link>

            <Link
              to="/wizard"
              className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-navy-400 transition-colors block text-left"
            >
              <div className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit mb-1 border border-slate-300">
                Grains & Flours
              </div>
              <div className="font-bold text-xs text-navy-950">Whole Wheat Flour</div>
              <p className="text-[11px] text-slate-500 mt-1">12.5% moisture. Moisture caking & insect barrier in ambient conditions.</p>
            </Link>

          </div>
        </div>
      </section>

    </div>
  );
}
