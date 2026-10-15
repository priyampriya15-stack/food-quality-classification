import React from 'react';

export default function Footer({ onNavigate, healthStatus, modelsInfo }) {
  // Check if active model or backend is loaded and ready
  const isModelReady = Boolean(
    modelsInfo?.is_loaded || 
    healthStatus?.model_loaded || 
    healthStatus?.status === 'ok'
  );

  const navLinks = [
    { id: 'home', label: 'Home Overview' },
    { id: 'assess', label: 'Produce Assessment' },
    { id: 'analytics', label: 'Quality Analytics' },
    { id: 'history', label: 'Analysis History' },
    { id: 'models', label: 'Deep Learning Models' },
    { id: 'about', label: 'About & Methodology' },
  ];

  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Three Columns on Desktop / Two on Tablet / Stack on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Column 1 — Brand */}
          <div className="space-y-2.5">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                FoodQuality <span className="text-emerald-400">AI</span>
              </h3>
              <p className="text-xs font-medium text-emerald-400/90 mt-0.5">
                Automated Visual Quality Assessment
              </p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Food Quality Classification Project &mdash; an AI-assisted visual screening system designed to classify food images based on learned freshness-related patterns.
            </p>
          </div>

          {/* Column 2 — Technology Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Technology Stack
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              React 18 &middot; Tailwind CSS &middot; FastAPI &middot; SQLite &middot; TensorFlow / Keras 3
            </p>
            <ul className="space-y-1.5 text-xs text-slate-400 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>React 18</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>Tailwind CSS</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>FastAPI</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>SQLite</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <span>TensorFlow / Keras 3</span>
              </li>
            </ul>
          </div>

          {/* Column 3 — Platform Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform Navigation
            </h4>
            <ul className="space-y-1.5 text-xs">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onNavigate && onNavigate(link.id)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer text-left py-0.5"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section: Divider + Academic Notice + Copyright */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-900 space-y-4">
          <div className="space-y-1 text-xs text-slate-400">
            <h5 className="font-semibold text-slate-300">
              Academic Screening Notice
            </h5>
            <p className="leading-relaxed">
              &ldquo;For academic and assistive quality screening only. Visual predictions do not establish food safety or confirm contamination.&rdquo;
            </p>
            <p className="text-slate-500 leading-relaxed">
              &ldquo;Visual inspection reflects machine-learned appearance patterns and must not be used as the sole basis for consumption decisions.&rdquo;
            </p>
          </div>

          <div className="pt-4 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p className="text-center sm:text-left">
              &copy; 2026 FoodQuality AI | Academic Project
            </p>
            <div>
              {isModelReady ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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

      </div>
    </footer>
  );
}
