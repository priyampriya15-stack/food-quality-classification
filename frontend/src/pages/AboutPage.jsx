import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  BarChart3, 
  Cpu, 
  AlertTriangle, 
  ArrowRight,
  Layers,
  RefreshCw,
  CheckCircle2,
  FileCode
} from 'lucide-react';
import aboutProduceImg from '../assets/about_produce.jpg';
import { getModels } from '../services/api';

export default function AboutPage({ onNavigateTab, modelsInfo: propModelsInfo }) {
  const [modelsData, setModelsData] = useState(propModelsInfo || null);
  const [loadingModels, setLoadingModels] = useState(!propModelsInfo);
  const [modelsError, setModelsError] = useState(null);

  useEffect(() => {
    if (propModelsInfo) {
      setModelsData(propModelsInfo);
      setLoadingModels(false);
      return;
    }

    let isMounted = true;
    const fetchModelDetails = async () => {
      try {
        setLoadingModels(true);
        const data = await getModels();
        if (isMounted) {
          setModelsData(data);
          setModelsError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Unable to load models data for About page:', err.message);
          setModelsError('Model status information is currently unavailable from the backend service.');
        }
      } finally {
        if (isMounted) {
          setLoadingModels(false);
        }
      }
    };

    fetchModelDetails();
    return () => {
      isMounted = false;
    };
  }, [propModelsInfo]);

  // Verified capabilities operational in the existing frontend and backend code
  const availableFeatures = [
    {
      title: 'Produce Assessment',
      description: 'Upload food images in supported formats (JPEG, PNG, WebP) up to 10 MB for automated visual freshness evaluation.',
      icon: UploadCloud,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Binary Quality Classification',
      description: 'Predicts whether visible exterior characteristics align with Fresh or Spoiled categories learned during model training.',
      icon: ShieldCheck,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Confidence Score & Probabilities',
      description: 'Displays the model confidence percentage and per-class probability breakdown for each analyzed image.',
      icon: Sparkles,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Inspection History',
      description: 'Maintains a database audit log of past assessments with inspection dates, timestamps, outcomes, and optional user notes.',
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

  // Extract live model status from backend response
  const activeKey = modelsData?.active_model || 'best';
  const activeDetails = modelsData?.models_details?.[activeKey];
  const isLoaded = Boolean(modelsData?.is_loaded);
  const activeArchName = activeDetails?.architecture || (activeKey === 'best' ? 'Custom CNN Baseline' : activeKey);
  const modelFilename = activeDetails?.filename || 'best_model.keras';
  const modelSizeMb = activeDetails?.size_mb ? `${activeDetails.size_mb} MB` : null;
  const inputResolution = activeDetails?.input_shape ? `${activeDetails.input_shape.join(' × ')} (RGB)` : '224 × 224 × 3 (RGB)';
  const efficientNetTrained = Boolean(modelsData?.models_details?.efficientnet?.exists);

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* 1. Our Mission */}
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
              FoodQuality AI is an academic project exploring computer vision and deep learning for visual food quality classification.
            </p>
            <p className="text-slate-400">
              The goal is to demonstrate how AI-assisted visual screening may support preliminary food quality assessment by identifying exterior patterns of freshness and deterioration.
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

              <div className="absolute bottom-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Fresh Produce &bull; Visual Analysis
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 hidden xs:inline-block">
                  Binary Classifier (Fresh / Spoiled)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Project Overview */}
      <div className="p-4 xs:p-5 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
          <Layers className="w-5 h-5" />
          <span>Project Overview</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          FoodQuality AI provides an automated visual inspection interface designed to analyze digital photographs of fruits and vegetables. Users can upload produce images to assess whether their exterior characteristics match learned Fresh or Spoiled visual indicators.
        </p>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          The system evaluates the uploaded image through an inference pipeline, producing a classification result alongside confidence metrics and estimated class distributions. When used in an authenticated session, inspection records are stored in a local SQLite database with timestamps, notes, and aggregate quality analytics.
        </p>
      </div>

      {/* 3. Available Features */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Available Features
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed capabilities verified in the existing frontend and backend implementation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableFeatures.map((item, idx) => {
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

      {/* 4. Model Information (Verified from Backend API) */}
      <div className="p-4 xs:p-5 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm sm:text-base">
            <Cpu className="w-5 h-5" />
            <span>Model Information</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            Backend Verified Status
          </span>
        </div>

        {loadingModels && (
          <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading model verification details from backend...</span>
          </div>
        )}

        {modelsError && !modelsData && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            {modelsError}
          </div>
        )}

        {modelsData && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Active Architecture</span>
                <p className="font-bold text-white truncate">{activeArchName}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Inference Status</span>
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {isLoaded ? 'Loaded & Operational' : 'Offline'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Model Checkpoint</span>
                <p className="font-bold text-slate-200 truncate">
                  {modelFilename} {modelSizeMb && <span className="text-slate-500 font-normal">({modelSizeMb})</span>}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Target Classes</span>
                <p className="font-bold text-slate-200">Fresh &bull; Spoiled</p>
              </div>
            </div>

            {/* Architecture Distinction Note */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-200">Implementation Distinction: </span>
              The <strong className="text-emerald-400">{activeArchName}</strong> is trained and actively loaded in memory for all real-time inference requests. While transfer learning architectures such as EfficientNetB0 are referenced in the codebase for benchmarking, they are not currently trained or active for production inference ({efficientNetTrained ? 'Trained' : 'Not trained yet'}).
            </div>
          </div>
        )}
      </div>

      {/* 5. Food Safety Disclaimer */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-200 shadow-lg">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-200 text-xs sm:text-sm">
              Food Safety Notice
            </h3>
            <p className="text-xs sm:text-sm text-amber-300/95 leading-relaxed font-medium">
              FoodQuality AI is intended for academic and assistive visual screening only. Visual predictions do not establish microbiological safety, contamination, toxicity, or suitability for consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
