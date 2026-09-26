import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Thermometer, 
  Droplets, 
  Flame, 
  Truck, 
  Wind, 
  Layers, 
  DollarSign, 
  Leaf, 
  ShieldAlert, 
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Apple
} from 'lucide-react';
import { getCommodities, recommendPackaging } from '../services/api';

export default function WizardPage({ onRecommendationComplete }) {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Form State containing ALL SIH PS-required parameters
  const [formData, setFormData] = useState({
    commodity_name: 'Potato Chips',
    moisture_content_percent: 1.8,
    fat_content_percent: 34.5,
    ph_value: 6.2,
    desired_shelf_life_days: 180,
    storage_temperature_c: 25.0,
    relative_humidity_percent: 65.0,
    storage_type: 'Ambient',
    transportation_condition: 'Standard Road',
    is_fresh_produce: false,
    respiration_category: 'NONE',
    map_required: false,
    user_priority: 'Balanced'
  });

  // Fetch preset commodities on mount
  useEffect(() => {
    getCommodities()
      .then((data) => {
        setCommodities(data);
        if (data.length > 0) {
          const first = data[0];
          setSelectedPresetId(first.id.toString());
          applyPreset(first);
        }
      })
      .catch((err) => console.error("Error loading commodities:", err));
  }, []);

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      commodity_name: preset.name,
      moisture_content_percent: preset.standard_moisture_percent,
      fat_content_percent: preset.standard_fat_percent,
      ph_value: preset.standard_ph,
      is_fresh_produce: preset.is_fresh_produce,
      respiration_category: preset.respiration_category || 'NONE',
      map_required: preset.map_suitable || false,
      storage_type: preset.is_fresh_produce ? 'Refrigerated' : (preset.name.includes('Paneer') ? 'Refrigerated' : 'Ambient'),
      storage_temperature_c: preset.is_fresh_produce ? 4.0 : (preset.name.includes('Paneer') ? 4.0 : 25.0),
      desired_shelf_life_days: preset.is_fresh_produce ? 14 : (preset.name.includes('Chips') ? 180 : 90)
    }));
  };

  const handlePresetSelect = (id) => {
    setSelectedPresetId(id);
    if (id === 'CUSTOM') {
      setFormData((prev) => ({
        ...prev,
        commodity_name: 'Custom Food Product'
      }));
    } else {
      const found = commodities.find((c) => c.id.toString() === id.toString());
      if (found) applyPreset(found);
    }
  };

  const handleSliderChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  // Automated live risk calculation for preview panel
  const getLiveRisks = () => {
    const risks = [];
    if (formData.moisture_content_percent < 5.0 && formData.relative_humidity_percent > 50.0) {
      risks.push({
        title: "Critical Crispness Loss Risk",
        desc: `Dry matrix (${formData.moisture_content_percent}%) will absorb moisture in ${formData.relative_humidity_percent}% RH ambient air.`
      });
    } else if (formData.moisture_content_percent < 15.0 && formData.relative_humidity_percent > 65.0) {
      risks.push({
        title: "Moisture Caking Hazard",
        desc: "High ambient humidity will cause powder clumping or staling."
      });
    }

    if (formData.fat_content_percent > 20.0) {
      risks.push({
        title: "Lipid Oxidation Rancidity",
        desc: `High lipid content (${formData.fat_content_percent}%) demands UV light shielding and elevated O2 barrier.`
      });
    }

    if (formData.ph_value < 4.5) {
      risks.push({
        title: "Acidic Corrosion Risk",
        desc: `Food pH (${formData.ph_value}) requires chemically inert inner contact polyolefin layer.`
      });
    }

    if (formData.storage_type === 'Frozen' || formData.storage_temperature_c < 0) {
      risks.push({
        title: "Sub-Zero Thermal Stress",
        desc: "Cold chain requires film impact resilience to prevent flex-cracking."
      });
    }

    if (formData.is_fresh_produce) {
      risks.push({
        title: "Produce Respiration Protocol",
        desc: "Living commodity requires controlled gas transmission to prevent anaerobic rotting."
      });
    }

    return risks;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    // 1. Missing Required Input Validation
    if (!formData.commodity_name || !formData.commodity_name.trim()) {
      setError("Missing Required Input: Please select or enter a food commodity name.");
      setCurrentStep(1);
      return;
    }

    // 2. Numeric Range Validations
    if (isNaN(formData.moisture_content_percent) || formData.moisture_content_percent < 0.0 || formData.moisture_content_percent > 100.0) {
      setError("Invalid Numeric Input: Moisture content must be a valid percentage between 0.0% and 100.0%.");
      setCurrentStep(2);
      return;
    }

    if (isNaN(formData.fat_content_percent) || formData.fat_content_percent < 0.0 || formData.fat_content_percent > 100.0) {
      setError("Invalid Numeric Input: Fat/Lipid content must be a valid percentage between 0.0% and 100.0%.");
      setCurrentStep(2);
      return;
    }

    if (isNaN(formData.ph_value) || formData.ph_value < 1.0 || formData.ph_value > 14.0) {
      setError("Invalid Numeric Input: Acidity (pH) must be between 1.0 (strongly acidic) and 14.0 (strongly alkaline).");
      setCurrentStep(2);
      return;
    }

    if (isNaN(formData.desired_shelf_life_days) || formData.desired_shelf_life_days < 1 || formData.desired_shelf_life_days > 1000) {
      setError("Invalid Numeric Input: Desired shelf life must be between 1 and 1000 days.");
      setCurrentStep(3);
      return;
    }

    if (isNaN(formData.storage_temperature_c) || formData.storage_temperature_c < -30.0 || formData.storage_temperature_c > 60.0) {
      setError("Invalid Numeric Input: Storage temperature must be between -30°C and 60°C.");
      setCurrentStep(3);
      return;
    }

    if (isNaN(formData.relative_humidity_percent) || formData.relative_humidity_percent < 0.0 || formData.relative_humidity_percent > 100.0) {
      setError("Invalid Numeric Input: Relative humidity must be between 0% and 100% RH.");
      setCurrentStep(3);
      return;
    }

    setLoading(true);

    try {
      const response = await recommendPackaging(formData);
      localStorage.setItem('packai_last_recommendation', JSON.stringify(response));
      localStorage.setItem('packai_last_request', JSON.stringify(formData));
      
      if (onRecommendationComplete) {
        onRecommendationComplete(response, formData);
      }
      navigate('/results');
    } catch (err) {
      console.error("Recommendation request error:", err);
      if (!err.response) {
        setError("Backend Server Unavailable: Unable to connect to the FastAPI recommendation engine. Please ensure the backend service is running and accessible.");
      } else if (err.response.status === 422) {
        setError("Validation Error: One or more input parameters fall outside allowable physical ranges for packaging evaluation. Please check food characteristics and storage values.");
      } else if (err.response.status === 500) {
        setError("System Configuration Notice: The packaging material database may be empty or uninitialized. Please ensure seed data is loaded.");
      } else {
        setError("Recommendation Processing Failure: An unexpected error occurred while evaluating packaging rules. Please review input values and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCommodities = commodities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const liveRisks = getLiveRisks();

  const steps = [
    { number: 1, label: "Commodity", title: "Select Food Commodity" },
    { number: 2, label: "Properties", title: "Food Characteristics" },
    { number: 3, label: "Storage", title: "Storage Conditions" },
    { number: 4, label: "Transport", title: "Transportation Conditions" },
    { number: 5, label: "Produce / MAP", title: "Fresh Produce & MAP Protocol" },
    { number: 6, label: "Review & Run", title: "Optimization & Recommendation" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Title & Context */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800">Decision Support Wizard • SIH 26236</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">Food Packaging Specification Wizard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure food chemistry, post-harvest respiration, logistics, and storage to determine optimal packaging structures.
          </p>
        </div>

        {/* Quick jump to results if previous recommendation exists */}
        {localStorage.getItem('packai_last_recommendation') && (
          <button
            onClick={() => navigate('/results')}
            className="text-xs font-semibold text-navy-800 hover:text-navy-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 w-fit cursor-pointer"
          >
            View Last Recommendation →
          </button>
        )}
      </div>

      {/* Stepper Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[620px]">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <React.Fragment key={s.number}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.number)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-navy-900 text-white shadow-2xs' 
                      : isCompleted 
                        ? 'text-navy-800 hover:bg-slate-100' 
                        : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent 
                      ? 'bg-saffron-500 text-navy-950' 
                      : isCompleted 
                        ? 'bg-forest-100 text-forest-800' 
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isCompleted ? '✓' : s.number}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < steps.length - 1 && (
                  <div className="h-0.5 w-6 bg-slate-200 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Step Form (8 cols) + Right Live Risk Panel (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Container */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
          
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {currentStep} of 6</span>
              <h2 className="text-lg font-bold text-navy-950">{steps[currentStep - 1].title}</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Active: <strong className="text-navy-950">{formData.commodity_name}</strong>
            </span>
          </div>

          {/* Form Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-xs font-bold text-rose-700 hover:text-rose-950 cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* STEP 1: COMMODITY SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Choose a pre-configured food commodity with laboratory nutritional data (USDA / Literature) or specify a custom commodity:
              </p>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search preset commodities by name or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-800"
                />
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredCommodities.map((item) => {
                  const isSelected = selectedPresetId === item.id.toString();
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePresetSelect(item.id.toString())}
                      className={`p-3 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                        isSelected
                          ? 'border-navy-900 bg-navy-50/70 text-navy-950 font-bold ring-1 ring-navy-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-navy-900 flex-shrink-0" />}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{item.category}</span>
                      <div className="text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-100 flex justify-between">
                        <span>Water: {item.standard_moisture_percent}%</span>
                        <span>Fat: {item.standard_fat_percent}%</span>
                      </div>
                    </button>
                  );
                })}

                {/* Custom Food Option */}
                <button
                  type="button"
                  onClick={() => handlePresetSelect('CUSTOM')}
                  className={`p-3 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                    selectedPresetId === 'CUSTOM'
                      ? 'border-navy-900 bg-navy-50/70 text-navy-950 font-bold ring-1 ring-navy-900'
                      : 'border-dashed border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold">+ Custom Commodity</div>
                  <span className="text-[10px] text-slate-400 block font-normal mt-0.5">Enter custom chemistry manually</span>
                </button>
              </div>

              {/* Custom commodity name field */}
              {selectedPresetId === 'CUSTOM' && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Commodity Name:</label>
                  <input
                    type="text"
                    value={formData.commodity_name}
                    onChange={(e) => setFormData({ ...formData, commodity_name: e.target.value })}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-800"
                    placeholder="e.g., Roasted Cashews, Fresh Spinach, Pickled Mango"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: FOOD CHARACTERISTICS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Specify food chemical properties. These determine moisture barrier requirements, UV light shielding, and chemical inertness:
              </p>

              <div className="space-y-4">
                
                {/* Moisture Content Slider */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span>Moisture Content (% wet basis)</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.moisture_content_percent}
                        onChange={(e) => handleSliderChange('moisture_content_percent', e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.moisture_content_percent}
                    onChange={(e) => handleSliderChange('moisture_content_percent', e.target.value)}
                    className="custom-range-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Bone Dry / Crisp)</span>
                    <span>50% (Semi-Moist)</span>
                    <span>100% (High Water / Liquid)</span>
                  </div>
                </div>

                {/* Lipid / Fat Content Slider */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Fat / Lipid Content (%)</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={formData.fat_content_percent}
                        onChange={(e) => handleSliderChange('fat_content_percent', e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.fat_content_percent}
                    onChange={(e) => handleSliderChange('fat_content_percent', e.target.value)}
                    className="custom-range-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0% (Fat-Free)</span>
                    <span>15% (Oxidation Threshold)</span>
                    <span>35%+ (Critical Rancidity Risk)</span>
                  </div>
                </div>

                {/* pH Acidity Slider */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950">Acidity (pH Value)</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="14"
                        step="0.1"
                        value={formData.ph_value}
                        onChange={(e) => handleSliderChange('ph_value', e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                      />
                      <span className="text-xs font-bold text-slate-500">pH</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    value={formData.ph_value}
                    onChange={(e) => handleSliderChange('ph_value', e.target.value)}
                    className="custom-range-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>pH 2.0 (High Acid)</span>
                    <span>pH 4.6 (Acid Food Limit)</span>
                    <span>pH 7.0 (Neutral)</span>
                  </div>
                </div>

                {/* Progressive Disclosure: Advanced Sensitivity Indicators */}
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-navy-900 cursor-pointer"
                  >
                    <span>Advanced Sensitivity & Chemical Parameters</span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="pt-3 mt-2 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Derived Oxygen Sensitivity:</span>
                        <strong className="text-navy-950">{formData.fat_content_percent > 15 ? 'HIGH (Rancidity prone)' : 'MODERATE'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Derived Light Sensitivity:</span>
                        <strong className="text-navy-950">{formData.fat_content_percent > 20 ? 'CRITICAL (Requires opaque barrier)' : 'STANDARD'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Chemical Contact Demand:</span>
                        <strong className="text-navy-950">{formData.ph_value < 4.5 ? 'Inert polyolefin contact required' : 'Standard food grade'}</strong>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: STORAGE CONDITIONS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Define the intended storage temperature, humidity gradient, and distribution chain:
              </p>

              <div className="space-y-4">
                
                {/* Storage Type Button Group */}
                <div>
                  <label className="block text-xs font-bold text-navy-950 mb-1.5">Storage Category:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Ambient', 'Refrigerated', 'Frozen'].map((type) => {
                      const isSelected = formData.storage_type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              storage_type: type,
                              storage_temperature_c: type === 'Frozen' ? -18.0 : (type === 'Refrigerated' ? 4.0 : 25.0)
                            });
                          }}
                          className={`py-2.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-navy-900 text-white border-navy-950 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Storage Temperature Slider */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950 flex items-center gap-1.5">
                      <Thermometer className="w-4 h-4 text-rose-600" />
                      <span>Storage Temperature (°C)</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="-40"
                        max="60"
                        step="1"
                        value={formData.storage_temperature_c}
                        onChange={(e) => handleSliderChange('storage_temperature_c', e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                      />
                      <span className="text-xs font-bold text-slate-500">°C</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="50"
                    step="1"
                    value={formData.storage_temperature_c}
                    onChange={(e) => handleSliderChange('storage_temperature_c', e.target.value)}
                    className="custom-range-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>-18°C (Frozen)</span>
                    <span>4°C (Cold Chain)</span>
                    <span>25°C (Room Temp)</span>
                    <span>45°C (Tropical)</span>
                  </div>
                </div>

                {/* Relative Humidity Slider */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950">Ambient Relative Humidity (% RH)</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        step="1"
                        value={formData.relative_humidity_percent}
                        onChange={(e) => handleSliderChange('relative_humidity_percent', e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                      />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={formData.relative_humidity_percent}
                    onChange={(e) => handleSliderChange('relative_humidity_percent', e.target.value)}
                    className="custom-range-slider"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>30% RH (Dry)</span>
                    <span>65% RH (Standard Ambient)</span>
                    <span>90% RH (Monsoon / Cold Storage)</span>
                  </div>
                </div>

                {/* Target Shelf Life Days */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-navy-950">Target Shelf Life (Days)</span>
                    <input
                      type="number"
                      min="1"
                      max="730"
                      value={formData.desired_shelf_life_days}
                      onChange={(e) => handleSliderChange('desired_shelf_life_days', e.target.value)}
                      className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[14, 30, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, desired_shelf_life_days: d })}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded border cursor-pointer ${
                          formData.desired_shelf_life_days === d
                            ? 'bg-navy-900 text-white border-navy-950'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {d < 30 ? `${d} Days` : d === 30 ? '1 Month' : `${Math.round(d / 30)} Months`}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 4: TRANSPORTATION CONDITIONS */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Select logistics channels. Rough vibration and maritime export demand high seal hermeticity and puncture resilience:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: 'Standard Road',
                    title: 'Standard Road Logistics',
                    desc: 'Paved highway transit with standard freight handling and mild vibration.'
                  },
                  {
                    value: 'Rough Road / High Vibration',
                    title: 'Rough Road / High Vibration',
                    desc: 'Unpaved rural roads, pothole impacts, and elevated freight vibration stress.'
                  },
                  {
                    value: 'Air Cargo',
                    title: 'Air Cargo Freight',
                    desc: 'Cabin pressure variations and rapid altitude-induced pressure differentials.'
                  },
                  {
                    value: 'Export / Maritime',
                    title: 'Export / Maritime Container',
                    desc: 'Long duration sea freight with sustained humidity swings and container stacking load.'
                  }
                ].map((opt) => {
                  const isSelected = formData.transportation_condition === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, transportation_condition: opt.value })}
                      className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-navy-900 bg-navy-50/70 text-navy-950 font-bold ring-1 ring-navy-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-navy-700" />
                          <span>{opt.title}</span>
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-navy-900" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal leading-relaxed">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: FRESH PRODUCE & MAP PROTOCOL */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <h3 className="text-xs font-bold text-navy-950 flex items-center gap-1.5">
                    <Apple className="w-4 h-4 text-forest-700" />
                    <span>Is this fresh horticultural produce?</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Living agricultural commodities respire and need special gas transmission films to prevent asphyxiation.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_fresh_produce}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        is_fresh_produce: checked,
                        respiration_category: checked ? 'MODERATE' : 'NONE',
                        map_required: checked,
                        storage_type: checked ? 'Refrigerated' : formData.storage_type
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-700"></div>
                </label>
              </div>

              {formData.is_fresh_produce ? (
                <div className="space-y-4 p-4 bg-forest-50/50 rounded-lg border border-forest-200">
                  <div>
                    <label className="block text-xs font-bold text-navy-950 mb-1">Produce Respiration Rate Tier:</label>
                    <select
                      value={formData.respiration_category}
                      onChange={(e) => setFormData({ ...formData, respiration_category: e.target.value })}
                      className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="LOW">LOW — Apples, Onions, Potatoes, Citrus</option>
                      <option value="MODERATE">MODERATE — Tomatoes, Cucumbers, Carrots</option>
                      <option value="HIGH">HIGH — Strawberries, Berries, Cauliflower</option>
                      <option value="EXTREMELY_HIGH">EXTREMELY HIGH — Mushrooms, Asparagus, Spinach</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">Modified Atmosphere Packaging (MAP)</span>
                      <span className="text-[11px] text-slate-500">Inject equilibrium gas flushing (reduced O2, enriched CO2)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.map_required}
                        onChange={(e) => setFormData({ ...formData, map_required: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-navy-900"></div>
                    </label>
                  </div>

                  <div className="text-[11px] text-forest-900 bg-forest-100/60 p-2.5 rounded border border-forest-200">
                    <strong>Rule Engine Guarantee:</strong> If MAP is toggled OFF, airtight barrier films (EVOH, Alu Foil) are automatically disqualified to protect produce from anaerobic fermentation rot.
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Fresh produce mode is inactive</p>
                  <p className="text-[11px] text-slate-500">
                    Commodity is treated as processed, dry, or shelf-stable food. Respiration filtering is bypassed.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: OPTIMIZATION PRIORITY & REVIEW */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <p className="text-xs text-slate-600">
                Select your engineering optimization priority to adjust the multi-criteria scoring weights:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    value: 'Balanced',
                    title: 'Balanced Optimization (Standard)',
                    desc: 'Harmonizes shelf-life preservation (35%), food safety (20%), cost viability (10%), and eco factors (10%).'
                  },
                  {
                    value: 'Cost',
                    title: 'Cost-Driven Economy',
                    desc: 'Prioritizes budget efficiency (30% weight) for high-volume commercial competitive production.'
                  },
                  {
                    value: 'Sustainability',
                    title: 'Circular Sustainability',
                    desc: 'Elevates mono-material recyclability and certified bio-compostability (30% weight).'
                  },
                  {
                    value: 'Barrier Performance',
                    title: 'Maximum Barrier Shield',
                    desc: 'Assigns 50% weight to oxygen, moisture, and UV light barrier for vulnerable export matrices.'
                  }
                ].map((p) => {
                  const isSelected = formData.user_priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, user_priority: p.value })}
                      className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-navy-900 bg-navy-50/70 text-navy-950 font-bold ring-1 ring-navy-900'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span>{p.title}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-navy-900" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal">{p.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Review Summary Card */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Configuration Summary</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div><span className="text-slate-400">Commodity:</span> <strong className="block text-navy-950">{formData.commodity_name}</strong></div>
                  <div><span className="text-slate-400">Moisture:</span> <strong className="block text-navy-950">{formData.moisture_content_percent}%</strong></div>
                  <div><span className="text-slate-400">Lipid Fat:</span> <strong className="block text-navy-950">{formData.fat_content_percent}%</strong></div>
                  <div><span className="text-slate-400">Acidity:</span> <strong className="block text-navy-950">pH {formData.ph_value}</strong></div>
                  <div><span className="text-slate-400">Storage:</span> <strong className="block text-navy-950">{formData.storage_type} ({formData.storage_temperature_c}°C)</strong></div>
                  <div><span className="text-slate-400">Shelf Life:</span> <strong className="block text-navy-950">{formData.desired_shelf_life_days} Days</strong></div>
                  <div><span className="text-slate-400">Logistics:</span> <strong className="block text-navy-950">{formData.transportation_condition}</strong></div>
                  <div><span className="text-slate-400">Priority:</span> <strong className="block text-navy-950">{formData.user_priority}</strong></div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-navy-950 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 px-5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to {steps[currentStep].label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 disabled:bg-slate-400 px-6 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-saffron-400" />
                <span>{loading ? 'Evaluating Rules...' : 'Generate Packaging Recommendation'}</span>
              </button>
            )}
          </div>

        </div>

        {/* Right Sidebar: Automated Risk Anticipation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-200/80 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-800 block">Real-Time Risk Engine</span>
              <h3 className="text-sm font-bold text-navy-950">Automated Risk Anticipation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Physical and biochemical hazards detected from current parameters:</p>
            </div>

            {liveRisks.length > 0 ? (
              <div className="space-y-2.5">
                {liveRisks.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-0.5">
                    <span className="font-bold text-navy-950 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span>{risk.title}</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{risk.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-400">
                Baseline stable parameters. No critical moisture or rancidity risks flagged.
              </div>
            )}

            {/* Quick Action: Skip to Recommendation */}
            <div className="pt-2 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
                <span>{loading ? 'Evaluating...' : 'Run Recommendation Now'}</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Applies current parameters directly without completing remaining steps.
              </p>
            </div>

          </div>

          {/* Institutional Compliance Card */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <span className="text-[10px] font-bold text-navy-900 uppercase tracking-wider block">Decision Protocol</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Materials are filtered across thermal limits, fat-solvent resistance, and respiration barriers before multi-criteria scoring.
            </p>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Status: Online</span>
              <span>12 Materials Ready</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
