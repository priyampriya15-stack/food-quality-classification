import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function Footer({ onNavigate, healthStatus, modelsInfo }) {
  // Check if active model or backend is loaded and ready
  const isModelReady = Boolean(
    modelsInfo?.is_loaded || 
    healthStatus?.model_loaded || 
    healthStatus?.status === 'ok'
  );

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'assess', label: 'Assessment' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'history', label: 'History' },
    { id: 'models', label: 'Models' },
    { id: 'about', label: 'About' },
  ];

  return (
    <footer className="mt-auto border-t border-teal-500/20 bg-slate-950 text-slate-400 text-xs overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Three Columns on Desktop separated by thin vertical dividers */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-0">
          
          {/* Column 1 (Left) — Brand */}
          <div className="md:col-span-7 lg:col-span-5 lg:pr-8 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1">
                  FoodQuality <span className="text-emerald-400">AI</span>
                </h3>
                <p className="text-[11px] font-medium text-emerald-400/90 -mt-0.5">
                  Automated Visual Quality Assessment
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Food Quality Classification Project &mdash; an AI-assisted visual screening system designed to classify food images based on learned freshness-related patterns.
            </p>
          </div>

          {/* Column 2 (Center) — Platform Navigation */}
          <div className="md:col-span-5 lg:col-span-3 md:pl-6 lg:px-8 md:border-l border-teal-500/15 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onNavigate && onNavigate(link.id)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer text-left py-0.5 flex items-center gap-1.5"
                  >
                    <span className="text-emerald-500/60 text-xs font-bold">&rsaquo;</span>
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 (Right) — Academic Screening Notice inside a subtle bordered panel */}
          <div className="md:col-span-12 lg:col-span-4 lg:pl-8 lg:border-l border-teal-500/15 md:pt-6 lg:pt-0 md:border-t lg:border-t-0 border-teal-500/15 space-y-3">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-teal-500/20 text-slate-400 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                  <Info className="w-3 h-3" />
                </div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Academic Screening Notice
                </h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                For academic and assistive quality screening only. Visual predictions do not establish food safety or confirm contamination.
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Visual inspection reflects machine-learned appearance patterns and must not be used as the sole basis for consumption decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Divider + Copyright & Status */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; 2026 FoodQuality AI | Academic Project
          </p>
          <div>
            {isModelReady ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Model Ready &middot; Visual Quality Classifier
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Model Standby &middot; Visual Quality Classifier
              </span>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
