import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function FoodSafetyDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-200">Safety Notice:</strong> Visual appearance alone cannot determine microbiological food safety or pathogen contamination. This AI classifier is an experimental assistive tool.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-sm shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-200 text-sm sm:text-base mb-1">
            Official Food Safety &amp; Machine Learning Limitations Disclaimer
          </h3>
          <p className="text-amber-300/85 text-xs sm:text-sm leading-relaxed">
            This model estimates visual similarity to Fresh and Spoiled training labels. Its predictions and confidence scores do not establish microbiological safety, contamination, toxicity, or suitability for consumption. Do not rely on this system as the sole basis for food safety decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
