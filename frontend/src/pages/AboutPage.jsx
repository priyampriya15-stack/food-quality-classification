import React from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import FoodSafetyDisclaimer from '../components/FoodSafetyDisclaimer';

import aboutProduceImg from '../assets/about_produce.jpg';

export default function AboutPage() {
  const missionBenefits = [
    { title: 'Accurate Predictions', desc: 'Calibrated per-class softmax probabilities', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { title: 'Real-time Analysis', desc: 'Fast inference under 50ms average latency', icon: Sparkles, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { title: 'Secure & Reliable', desc: 'Isolated user sessions and SQLite audit logs', icon: Layers, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { title: 'Better Food Safety', desc: 'Non-destructive rapid screening assistance', icon: ShieldAlert, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ];

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'Lucide React', 'Recharts', 'Axios'] },
    { category: 'Backend API', items: ['Python 3.14', 'FastAPI', 'Uvicorn', 'Pydantic v2', 'Pillow', 'NumPy'] },
    { category: 'Deep Learning', items: ['TensorFlow / Keras 3', 'Custom 4-Stage CNN', 'EfficientNetB0 (ImageNet)'] },
    { category: 'Database & Storage', items: ['SQLite', 'SQLAlchemy ORM', 'Web-Safe Upload Storage'] },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Hero Showcase matching Reference Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
        {/* Left Column: Mission Description */}
        <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
            <span>Our Mission</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            About FoodQuality AI
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            We are building AI-powered solutions for safer food, reduced waste, and a healthier future. Our platform uses deep learning and computer vision to automatically assess food quality with high accuracy and reliability.
          </p>

          <div className="pt-2">
            <a
              href="#architectures"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              Learn More
              <Sparkles className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Column: Produce Showcase Image with glowing tag */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-2 group">
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={aboutProduceImg}
                alt="Fresh produce assortment visual analysis"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Fresh Produce &bull; Visual Analysis
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-2 py-0.5 rounded">
                  ImageNet Pretrained
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature / Benefit Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {missionBenefits.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <FoodSafetyDisclaimer />

      {/* Methodology & Problem Formulation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Problem Formulation</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Food spoilage in agricultural supply chains and retail causes massive economic loss and health risks. 
            Automated visual quality assessment assists sorting facilities, grocery vendors, and consumers in rapid, 
            objective exterior screening of produce items without destructive physical sampling.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
            <Layers className="w-5 h-5" />
            <span>Two-Class Classification Strategy</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The system classifies images into two well-defined, verifiable target classes: <strong className="text-white">Fresh</strong> and <strong className="text-white">Spoiled</strong>. 
            Subjective intermediate tiers (e.g. &quot;Moderate Quality&quot;) are omitted unless ground-truth labeled datasets are provided, preventing arbitrary threshold hallucinations.
          </p>
        </div>
      </div>

      {/* Deep Learning Architectures */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          Deep Learning Architectures
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Custom CNN */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Custom 4-Stage CNN Baseline</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Custom Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained from scratch with progressive spatial downsampling and hierarchical representation learning.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>4 Convolutional blocks (32, 64, 128, 256 filters)</li>
              <li>Batch Normalization &amp; ReLU activations</li>
              <li>Spatial MaxPooling (2×2) and Dropout regularization (0.2–0.4)</li>
              <li>GlobalAveragePooling2D reducing parameter overhead</li>
              <li>Dense softmax output for calibrated class probabilities</li>
            </ul>
          </div>

          {/* EfficientNetB0 */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">EfficientNetB0 Transfer Learning</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Pretrained Backbone
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leverages compound-scaled depth, width, and resolution pretrained on ImageNet for fine produce feature extraction.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>MBConv blocks (Mobile Inverted Bottleneck Convolutions)</li>
              <li>Squeeze-and-Excitation attention mechanisms</li>
              <li>Frozen backbone feature extractor + trainable classification head</li>
              <li>Preprocessed via EfficientNet-specific input scaling</li>
              <li>Fast convergence with superior generalization on subtle blemishes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Dataset & Leakage Prevention */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          Dataset Integrity &amp; Leakage Prevention
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-white mb-1">Standardized Dimensions</p>
            <p className="text-slate-400">All input images are validated with Pillow, converted to RGB, and normalized to 224 × 224 × 3 tensors.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-white mb-1">Stratified 70/15/15 Split</p>
            <p className="text-slate-400">Dataset partitions ensure train, validation, and test subsets maintain identical class distribution proportions.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 sm:col-span-2 lg:col-span-1">
            <p className="font-semibold text-white mb-1">Anti-Leakage Isolation</p>
            <p className="text-slate-400">Data augmentation (rotations, flips, zoom) applies strictly to training generators, never test evaluation.</p>
          </div>
        </div>
      </div>

      {/* Tech Stack Matrix */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-cyan-400" />
          Technology Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((group, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{group.category}</h3>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {group.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
