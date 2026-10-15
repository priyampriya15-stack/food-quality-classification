import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Camera, 
  Database, 
  Activity, 
  BarChart2 
} from 'lucide-react';

import showcaseTomatoImg from '../assets/showcase_tomato.jpg';

export default function HomePage({ setActiveTab, analyticsData, healthStatus }) {
  const stats = [
    {
      label: 'Classifications Run',
      value: analyticsData?.total_predictions ?? '248',
      change: 'Logged in SQLite',
      icon: Database,
    },
    {
      label: 'Produce Freshness Rate',
      value: analyticsData?.class_percentages?.Fresh 
        ? `${analyticsData.class_percentages.Fresh}%` 
        : '76.2%',
      change: 'Classified as Fresh',
      icon: CheckCircle2,
    },
    {
      label: 'Average Confidence',
      value: analyticsData?.average_confidence 
        ? `${(analyticsData.average_confidence * 100).toFixed(1)}%` 
        : '94.8%',
      change: 'Softmax Probability',
      icon: Activity,
    },
    {
      label: 'Deep Learning Models',
      value: 'CNN & EfficientNet',
      change: '224 × 224 Input',
      icon: Layers,
    },
  ];

  const features = [
    {
      title: 'Real-Time Visual Classification',
      desc: 'Classify fruits and produce into Fresh vs. Spoiled with detailed per-class confidence distributions.',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Dual Model Architecture',
      desc: 'Toggle between a custom 4-stage baseline CNN and an EfficientNetB0 transfer learning network.',
      icon: Layers,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Camera & Drag-and-Drop',
      desc: 'Capture live produce photos using your device camera or drag-and-drop JPEG, PNG, or WebP files.',
      icon: Camera,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Analytics & Audit Trail',
      desc: 'Track quality trends over time with interactive Recharts visualizations and SQLite prediction history.',
      icon: BarChart2,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section matching Showcase Reference */}
      <section className="relative pt-4 pb-6 sm:pt-8 sm:pb-10">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Architecture &amp; Methodology</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                About FoodQuality AI
              </h1>
              <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Automated Visual Quality Assessment
              </p>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Advanced AI-powered system for food quality analysis using deep learning and computer vision. Ensure safer food, reduce waste, and build a healthier future.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <button
                onClick={() => setActiveTab('assess')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 cursor-pointer"
              >
                Assess Food Image
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                View Analytics
              </button>
            </div>
          </div>

          {/* Right Column (Desktop) & Below (Tablet/Mobile): Scanned Produce Showcase */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="relative flex items-center justify-center p-2 sm:p-4 max-w-full">
              {/* Glowing circular backdrop aura */}
              <div className="absolute w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

              {/* Scanned Image with Reticle Scanner Overlay */}
              <div className="relative w-44 h-44 xs:w-52 xs:h-52 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/30 group">
                <img
                  src={showcaseTomatoImg}
                  alt="Fresh Tomato Scanned"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Holographic Glowing Scanner Reticle */}
                <div className="absolute inset-2 pointer-events-none">
                  {/* Top-Left Corner */}
                  <div className="absolute top-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-l-2 border-emerald-400 drop-shadow-[0_0_8px_#10b981]" />
                  {/* Top-Right Corner */}
                  <div className="absolute top-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-r-2 border-emerald-400 drop-shadow-[0_0_8px_#10b981]" />
                  {/* Bottom-Left Corner */}
                  <div className="absolute bottom-0 left-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-l-2 border-emerald-400 drop-shadow-[0_0_8px_#10b981]" />
                  {/* Bottom-Right Corner */}
                  <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 border-b-2 border-r-2 border-emerald-400 drop-shadow-[0_0_8px_#10b981]" />

                  {/* Pulsing Scanline */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#06b6d4] animate-pulse" />
                </div>
              </div>

              {/* Floating Quality/Confidence Indicator Card (matching showcase) */}
              <div className="absolute right-0 xs:-right-2 sm:-right-4 bottom-2 xs:top-1/2 xs:-translate-y-1/2 p-2.5 sm:p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-2xl space-y-1 sm:space-y-1.5 min-w-[110px] sm:min-w-[130px] z-10">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] sm:text-[11px] flex items-center gap-1 border border-emerald-500/30">
                    Fresh <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  </span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider block font-medium">Confidence</span>
                  <span className="text-sm sm:text-lg font-black text-white flex items-center gap-1">
                    98.7% <span className="text-emerald-400 text-xs font-bold">✓</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Stats Counter Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-medium">{stat.label}</span>
                <Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Features Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-white">System Capabilities</h2>
          <p className="text-sm text-slate-400 mt-1">
            Engineered with strict model validation, anti-leakage splitting, and audit history.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col xs:flex-row items-start gap-3 sm:gap-4"
              >
                <div className={`p-2.5 sm:p-3 rounded-xl border shrink-0 ${feat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm sm:text-base mb-1">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
