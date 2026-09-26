import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2.5 text-xs sm:text-sm font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong className="font-semibold text-amber-950">Scientific Integrity Notice:</strong> This prototype provides decision-support based on qualitative barrier categories and verified literature references. All sample entries are labeled <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono text-[11px]">DEMO DATA</code> until certified via standardized laboratory barrier testing (ASTM D3985 / ASTM F1249).
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 hover:text-amber-950 transition-colors p-1"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
