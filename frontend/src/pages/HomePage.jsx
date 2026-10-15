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
import FoodSafetyDisclaimer from '../components/FoodSafetyDisclaimer';

import showcaseProduceImg from '../assets/showcase_produce.jpg';

export default function HomePage({ setActiveTab, analyticsData, healthStatus }) {
  const stats = [
    {
      label: 'Classifications Run',
      value: analyticsData?.total_predictions ?? '0',
      change: 'Logged in SQLite',
      icon: Database,
    },
    {
      label: 'Produce Freshness Rate',
      value: analyticsData?.class_percentages?.Fresh 
        ? `${analyticsData.class_percentages.Fresh}%` 
        : 'N/A',
      change: 'Classified as Fresh',
      icon: CheckCircle2,
    },
    {
      label: 'Average Confidence',
      value: analyticsData?.average_confidence 
        ? `${(analyticsData.average_confidence * 100).toFixed(1)}%` 
        : 'N/A',
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
      {/* Hero Section with AI Produce Scanner Showcase */}
      <section className="relative pt-4 pb-6 sm:pt-8 sm:pb-10">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs sm:text-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Automated Visual Quality Assessment &bull; Deep Learning Pipeline</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Deep Learning-Powered <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Food Quality Assessment
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Automated visual inspection of fruits and vegetables using Custom Convolutional Neural Networks and EfficientNetB0 transfer learning with transparent confidence scoring.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <button
                onClick={() => setActiveTab('assess')}
                className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                Assess Food Image
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all hover:-translate-y-0.5"
              >
                View Analytics
              </button>
            </div>

            {/* Feature Highlights Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time Inference
              </span>
              <span className="text-slate-700">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Dual-Model Architecture
              </span>
              <span className="text-slate-700">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Private SQLite Audit
              </span>
            </div>
          </div>

          {/* Right Column: Food Image with High-Tech Visual Scanning Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-2.5 group">
              {/* Image Container with Scanning Overlays */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={showcaseProduceImg}
                  alt="Food produce visual quality scanning preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Scanning Frame Reticle Overlay */}
                <div className="absolute inset-3 border border-emerald-500/30 rounded-lg pointer-events-none">
                  {/* 4 Corner Reticles */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5" />

                  {/* Pulsing Scan Beam */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse" />
                </div>

                {/* Top Overlay Badge: Live AI Scanner Indicator */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-medium text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>AI Visual Scanner</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold uppercase tracking-wider">
                    224×224
                  </span>
                </div>

                {/* Bottom Floating Quality/Confidence Indicator Card */}
                <div className="absolute bottom-3 inset-x-3 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Fresh Produce</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                          Grade A
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">Confidence: <strong className="text-emerald-400">98.4%</strong></p>
                    </div>
                  </div>

                  <div className="text-right pl-2 border-l border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Latency</span>
                    <span className="text-[11px] font-mono text-slate-300 font-medium">42 ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Disclaimer */}
      <FoodSafetyDisclaimer />

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
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-4"
              >
                <div className={`p-3 rounded-xl border shrink-0 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base mb-1">{feat.title}</h3>
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
