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
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 sm:pt-12 sm:pb-16 text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs sm:text-sm mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Automated Visual Quality Assessment &bull; Deep Learning Pipeline</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Deep Learning-Powered <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Food Quality Assessment
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Automated visual inspection of fruits and vegetables using Custom Convolutional Neural Networks and EfficientNetB0 transfer learning with transparent confidence scoring.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('assess')}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            Assess Food Image
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all hover:-translate-y-0.5"
          >
            View Dashboard Analytics
          </button>
        </div>
      </section>

      {/* Safety Disclaimer */}
      <FoodSafetyDisclaimer />

      {/* Stats Counter Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col justify-between"
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
