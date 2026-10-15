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

export default function AboutPage() {
  const techStack = [
    { category: 'Frontend', items: ['React 18', 'Vite', 'Tailwind CSS', 'Lucide React', 'Recharts', 'Axios'] },
    { category: 'Backend API', items: ['Python 3.14', 'FastAPI', 'Uvicorn', 'Pydantic v2', 'Pillow', 'NumPy'] },
    { category: 'Deep Learning', items: ['TensorFlow / Keras 3', 'Custom 4-Stage CNN', 'EfficientNetB0 (ImageNet)'] },
    { category: 'Database & Storage', items: ['SQLite', 'SQLAlchemy ORM', 'Web-Safe Upload Storage'] },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Project Architecture &amp; Methodology
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          About FoodQuality AI
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
          Automated Visual Quality Assessment of produce using deep convolutional neural networks and transfer learning.
        </p>
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
        <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-white mb-1">Standardized Dimensions</p>
            <p className="text-slate-400">All input images are validated with Pillow, converted to RGB, and normalized to 224 × 224 × 3 tensors.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <p className="font-semibold text-white mb-1">Stratified 70/15/15 Split</p>
            <p className="text-slate-400">Dataset partitions ensure train, validation, and test subsets maintain identical class distribution proportions.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
