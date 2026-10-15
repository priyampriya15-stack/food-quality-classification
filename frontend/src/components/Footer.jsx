import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const navLinks = [
    { id: 'home', label: 'Home Overview' },
    { id: 'assess', label: 'Produce Assessment' },
    { id: 'analytics', label: 'Quality Analytics' },
    { id: 'history', label: 'Analysis History' },
    { id: 'models', label: 'Deep Learning Models' },
    { id: 'about', label: 'About & Methodology' },
  ];

  const techStack = [
    'React 18',
    'Tailwind CSS',
    'FastAPI',
    'SQLite',
    'TensorFlow / Keras 3',
  ];

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand, Tagline, & Description */}
          <div className="md:col-span-6 lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  FoodQuality <span className="text-emerald-400">AI</span>
                </span>
                <p className="text-[11px] font-medium text-emerald-400/90 -mt-0.5">
                  Automated Visual Quality Assessment
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Food Quality Classification Project — an AI-assisted visual screening system designed to classify food images based on learned freshness-related patterns.
            </p>

            {/* Technology Stack */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Technology Stack
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                {techStack.map((tech, idx) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Quick Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onNavigate && onNavigate(link.id)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span className="text-emerald-500/60 text-[10px]">&rsaquo;</span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Disclaimer Section */}
          <div className="md:col-span-3 lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Academic Screening Notice
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs space-y-1.5 leading-relaxed">
              <p className="text-[11px] text-slate-300 font-medium">
                For academic and assistive quality screening only. Visual predictions do not establish food safety or confirm contamination.
              </p>
              <p className="text-[10px] text-slate-500">
                Visual inspection reflects machine-learned appearance patterns and must not be used as the sole basis for consumption decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Thin Divider & Bottom Copyright Line */}
        <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-center sm:text-left">
            &copy; 2026 FoodQuality AI | Academic Project
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Model Ready &bull; Visual Quality Classifier
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
