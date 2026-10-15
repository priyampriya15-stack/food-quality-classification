import React from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  BarChart3, 
  Cpu, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';
import aboutProduceImg from '../assets/about_produce.jpg';

export default function AboutPage({ onNavigateTab }) {
  // Verified features implemented and operational in the project
  const verifiedFeatures = [
    {
      title: 'Image Upload and Assessment',
      description: 'Upload produce photos in standard formats (JPEG, PNG, WebP) for automated visual screening.',
      icon: UploadCloud,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Fresh or Spoiled Classification',
      description: 'Binary visual classification evaluating produce images against learned Fresh and Spoiled visual categories.',
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Prediction Confidence Display',
      description: 'Displays the model confidence score and estimated class distribution for each assessed image.',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Analysis History',
      description: 'Maintains an audit log of past assessments with inspection dates, timestamps, outcomes, and optional user notes.',
      icon: Clock,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Quality Analytics',
      description: 'Aggregates overall assessment metrics, including total scans, Fresh vs. Spoiled distribution, and average confidence.',
      icon: BarChart3,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* 1. Hero / Mission Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left Column: Mission Description */}
        <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span>Our Mission</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            About FoodQuality AI
          </h1>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            <p>
              FoodQuality AI is an academic project that explores computer vision and deep learning for visual food quality classification. It analyzes uploaded food images and predicts whether the visible appearance resembles the Fresh or Spoiled classes learned during training.
            </p>
            <p className="text-slate-400">
              The goal is to demonstrate how AI-assisted visual screening may support preliminary food quality assessment.
            </p>
          </div>

          {onNavigateTab && (
            <div className="pt-2 flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => onNavigateTab('assess')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-[1.02]"
              >
                Start Produce Assessment
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Produce Showcase Image */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-2 group">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={aboutProduceImg}
                alt="Fresh produce assortment visual analysis"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Fresh Produce &bull; Visual Analysis
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  Binary Classifier (Fresh / Spoiled)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Features (Verified Capabilities) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Key Features
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Verified capabilities operational in the existing frontend and backend application.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {verifiedFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Concise Technical Overview (One Verified Paragraph) */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
          <Cpu className="w-5 h-5" />
          <span>Technical Architecture Overview</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          The application is built with a React and Tailwind CSS frontend powered by a FastAPI backend with SQLite persistence. Visual classification is performed using a convolutional neural network (CNN) trained to distinguish visual features of Fresh and Spoiled produce. While transfer learning architectures such as EfficientNetB0 are referenced in the codebase for benchmarking, the active production checkpoint currently loaded for inference is the Custom CNN baseline model.
        </p>
      </div>

      {/* 4. Single Academic & Food Safety Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-amber-200 text-sm sm:text-base">
              Academic Screening Notice
            </h3>
            <p className="text-xs sm:text-sm text-amber-300/95 leading-relaxed font-medium">
              FoodQuality AI is intended for academic and assistive visual screening only. Predictions do not establish microbiological safety, contamination, toxicity, or suitability for consumption.
            </p>
            <p className="text-[11px] sm:text-xs text-amber-400/80 leading-relaxed pt-0.5">
              Visual screening evaluates surface appearance only. It cannot detect internal pathogens, toxic bacterial residues, chemical spoilage, or nutritional status. Inspection results must not replace standard hygiene protocols or laboratory safety testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
