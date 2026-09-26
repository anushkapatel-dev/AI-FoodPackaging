import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import WizardPage from './pages/WizardPage';
import ResultsPage from './pages/ResultsPage';
import MaterialsPage from './pages/MaterialsPage';
import ComparePage from './pages/ComparePage';
import MethodologyPage from './pages/MethodologyPage';

export default function App() {
  const [currentRecommendation, setCurrentRecommendation] = useState(null);

  const handleRecommendationComplete = (result, requestData) => {
    setCurrentRecommendation({ result, requestData });
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-500 selection:text-white">
        <DisclaimerBanner />
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/wizard" 
              element={<WizardPage onRecommendationComplete={handleRecommendationComplete} />} 
            />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
