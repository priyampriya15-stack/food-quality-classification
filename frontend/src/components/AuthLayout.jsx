import React from 'react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthLayout({ children, onBackToHome, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[300px] bg-cyan-500/5 blur-[100px] rounded-full" />

      {/* Auth Navigation Header (No dashboard navbar) */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Home Link */}
          <button
            onClick={onBackToHome}
            className="flex items-center space-x-3 group text-left cursor-pointer focus:outline-none"
            title="Return to Home Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
              🥗
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  FoodQuality AI
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
                  DL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Automated Visual Quality Assessment</p>
            </div>
          </button>

          {/* Back to Home Button */}
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Main Authentication Content */}
      <main className="flex-1 flex flex-col justify-center items-center w-full px-4 py-8 sm:py-12 z-10">
        <div className="w-full max-w-md sm:max-w-lg">
          {children}
        </div>
      </main>

      {/* Minimal Dedicated Auth Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-1.5">
          <p className="font-medium text-slate-400">
            FoodQuality AI &bull; Deep Learning Visual Assessment Platform
          </p>
          <p className="text-[11px] text-slate-600">
            Visual inspection is intended for academic and assistive screening only.
          </p>
        </div>
      </footer>
    </div>
  );
}
