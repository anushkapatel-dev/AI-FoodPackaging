import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ChevronDown, 
  Layers, 
  Scale, 
  BookOpen, 
  Info, 
  Sparkles, 
  FileText, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMoreOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleReportsClick = (e) => {
    e.preventDefault();
    const lastRec = localStorage.getItem('packai_last_recommendation');
    if (lastRec) {
      navigate('/results');
    } else {
      navigate('/wizard');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      
      {/* Subtle National Tricolor Institutional Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-saffron-500 via-white to-forest-600 border-b border-slate-200/60" />

      {/* Institutional Top Identification Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-1 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy-900">National Decision-Support Prototype</span>
            <span className="text-slate-300">•</span>
            <span>SIH Problem Statement 26236</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Ministry & Industry Grade Evidence Architecture</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Zero-Fabrication Standard
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Product Title */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-xs border border-navy-950">
            <Package className="w-5 h-5 text-saffron-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-navy-950 text-xl tracking-tight">Pack<span className="text-navy-700">AI</span></span>
              <span className="bg-navy-50 text-navy-900 text-[10px] font-bold px-2 py-0.5 rounded border border-navy-200 uppercase tracking-wide">
                SIH 26236
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block leading-none mt-0.5">
              AI-Based Intelligent Food Packaging Decision Support System
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-700">
          
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              isActive('/') 
                ? 'text-navy-900 bg-navy-50 font-bold border border-navy-100' 
                : 'hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Home
          </Link>

          <Link
            to="/wizard"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              isActive('/wizard') 
                ? 'text-navy-900 bg-navy-50 font-bold border border-navy-100' 
                : 'hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Recommend
          </Link>

          <button
            onClick={handleReportsClick}
            className={`px-3.5 py-2 rounded-lg transition-colors cursor-pointer text-left ${
              isActive('/results') 
                ? 'text-navy-900 bg-navy-50 font-bold border border-navy-100' 
                : 'hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Reports
          </button>

          <Link
            to="/materials"
            className={`px-3.5 py-2 rounded-lg transition-colors ${
              isActive('/materials') 
                ? 'text-navy-900 bg-navy-50 font-bold border border-navy-100' 
                : 'hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Materials
          </Link>

          {/* "More" Dropdown Menu */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                moreOpen || isActive('/compare') || isActive('/methodology')
                  ? 'text-navy-900 bg-slate-100 font-bold'
                  : 'hover:text-navy-900 hover:bg-slate-100'
              }`}
            >
              <span>More</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Technical Decision Resources
                </div>
                
                <Link
                  to="/compare"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                >
                  <Scale className="w-4 h-4 text-navy-700" />
                  <div>
                    <div className="font-semibold">Compare Materials</div>
                    <div className="text-[10px] text-slate-500">Side-by-side technical matrix</div>
                  </div>
                </Link>

                <Link
                  to="/methodology#technical"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                >
                  <Layers className="w-4 h-4 text-navy-700" />
                  <div>
                    <div className="font-semibold">Technical Details</div>
                    <div className="text-[10px] text-slate-500">Rule engine & scoring weights</div>
                  </div>
                </Link>

                <Link
                  to="/methodology"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-navy-700" />
                  <div>
                    <div className="font-semibold">Methodology & Sources</div>
                    <div className="text-[10px] text-slate-500">ASTM, USDA, & Robertson literature</div>
                  </div>
                </Link>

                <Link
                  to="/methodology#about"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-navy-50 hover:text-navy-900 transition-colors border-t border-slate-100"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold">About the System</div>
                    <div className="text-[10px] text-slate-500">SIH 26236 prototype background</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-2">
          <Link
            to="/wizard"
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-saffron-400" />
            <span>Start Recommendation</span>
          </Link>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-sm font-semibold text-slate-700 shadow-md">
          <Link to="/" className="block py-2 px-3 rounded-lg hover:bg-slate-50">Home</Link>
          <Link to="/wizard" className="block py-2 px-3 rounded-lg hover:bg-slate-50">Recommend</Link>
          <button onClick={handleReportsClick} className="block w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50">Reports</button>
          <Link to="/materials" className="block py-2 px-3 rounded-lg hover:bg-slate-50">Materials</Link>
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-1">More Resources</span>
            <Link to="/compare" className="block py-1.5 px-3 text-xs text-slate-600 hover:bg-slate-50">Compare Materials</Link>
            <Link to="/methodology#technical" className="block py-1.5 px-3 text-xs text-slate-600 hover:bg-slate-50">Technical Details</Link>
            <Link to="/methodology" className="block py-1.5 px-3 text-xs text-slate-600 hover:bg-slate-50">Methodology & Sources</Link>
            <Link to="/methodology#about" className="block py-1.5 px-3 text-xs text-slate-600 hover:bg-slate-50">About the System</Link>
          </div>
        </div>
      )}

    </header>
  );
}
