import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Play, 
  Terminal, 
  Info, 
  RefreshCw, 
  X, 
  Activity, 
  Check, 
  FileCode 
} from 'lucide-react';
import { switchModel } from '../services/api';

export default function ModelsPage({ modelsInfo, onRefresh }) {
  const [switching, setSwitching] = useState(false);
  const [switchMessage, setSwitchMessage] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  // Close modal with Escape key and prevent background scroll while open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedModel(null);
      }
    };
    if (selectedModel) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedModel]);

  const handleSwitch = async (modelKey) => {
    setSwitching(true);
    setSwitchMessage(null);
    try {
      const resp = await switchModel(modelKey);
      setSwitchMessage({ type: 'success', text: resp.message || `Switched to ${modelKey}` });
      if (onRefresh) onRefresh();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setSwitchMessage({ type: 'error', text: detail });
    } finally {
      setSwitching(false);
    }
  };

  const isModelActive = (arch) => {
    if (!modelsInfo?.active_model) return arch.key === 'cnn';
    return (
      modelsInfo.active_model === arch.key ||
      (arch.key === 'cnn' && modelsInfo.active_model === 'best')
    );
  };

  const architectures = [
    {
      key: 'vgg16',
      name: 'VGG16',
      subtitle: 'Image Classification',
      category: 'Image Classification',
      desc: 'High accuracy, proven reliability.',
      fullDesc: 'Standard computer vision architecture referenced in literature for visual classification benchmarking.',
      architecture: '16-layer deep convolutional network (Simonyan & Zisserman, 2014) with 3×3 convolutions and max pooling stages.',
      purpose: 'Deep architectural baseline for comparing spatial representation and accuracy against specialized produce models.',
      badge: 'Deep Architecture',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      parameters: '~138 Million',
      inputShape: '224 × 224 × 3 RGB',
      details: { exists: false, isTheoretical: true },
    },
    {
      key: 'resnet50',
      name: 'ResNet50',
      subtitle: 'Feature Extraction',
      category: 'Feature Extraction',
      desc: 'Better feature representation.',
      fullDesc: 'Standard deep residual network referenced for benchmarking deep feature representation and transfer learning capability.',
      architecture: '50-layer deep residual network (He et al., 2015) using bottleneck residual blocks and identity skip connections.',
      purpose: 'Feature extraction benchmark to evaluate representation learning on high-resolution produce surface imagery.',
      badge: 'Residual Network',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      parameters: '~25.6 Million',
      inputShape: '224 × 224 × 3 RGB',
      details: { exists: false, isTheoretical: true },
    },
    {
      key: 'efficientnet',
      name: 'EfficientNetB0',
      subtitle: 'Lightweight & Fast',
      category: 'Lightweight & Fast',
      desc: 'Optimal performance vs size.',
      fullDesc: 'Lightweight & Fast — Standard computer vision architecture referenced for benchmarking visual food classification.',
      architecture: 'Compound scaling CNN backbone (Tan & Le, 2019) with inverted bottleneck depthwise-separable convolutions (MBConv).',
      purpose: 'Mobile, edge, and lightweight deployment candidate for visual food quality classification with minimal memory footprint.',
      badge: 'Pretrained Backbone',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      parameters: '~5.3 Million',
      inputShape: '224 × 224 × 3 RGB',
      details: modelsInfo?.models_details?.efficientnet,
    },
    {
      key: 'cnn',
      name: 'Custom Model',
      subtitle: 'Food Quality Classifier',
      category: 'Food Quality Classifier',
      desc: 'Trained on food dataset.',
      fullDesc: 'Custom 4-stage convolutional neural network baseline engineered and trained on food quality imagery for real-time visual assessment.',
      architecture: '4-stage Conv2D + BatchNorm + MaxPooling with Dropout (0.3) regularization and Dense softmax classification head.',
      purpose: 'Active production classifier trained on produce dataset for rapid Fresh vs. Spoiled binary classification.',
      badge: 'Custom CNN',
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      parameters: '~500K parameters (Lightweight baseline)',
      inputShape: '224 × 224 × 3 RGB',
      details: modelsInfo?.models_details?.cnn,
    },
  ];

  const renderModalStatusBadge = (arch) => {
    const active = isModelActive(arch);
    const exists = arch.details?.exists ?? false;

    if (active) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Active (Inference Ready)
        </span>
      );
    }

    if (exists) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Trained (.keras Checkpoint)
        </span>
      );
    }

    if (arch.details?.isTheoretical) {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-3 py-1 rounded-full">
          <Layers className="w-3.5 h-3.5" />
          Benchmark Reference
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
        <AlertCircle className="w-3.5 h-3.5" />
        Pending Training
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header matching Reference Screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Deep Learning Models</h1>
          <p className="text-sm text-slate-400 mt-1">
            Our system uses state-of-the-art deep learning models for accurate food quality assessment.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Models
        </button>
      </div>

      {/* Switch Notification */}
      {switchMessage && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            switchMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {switchMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <p>{switchMessage.text}</p>
        </div>
      )}

      {/* Models Grid: 4 cards matching reference screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {architectures.map((arch) => {
          const isActive = isModelActive(arch);
          const exists = arch.details?.exists ?? false;

          return (
            <div
              key={arch.key}
              className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${arch.color}`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{arch.name}</h3>
                  <p className="text-[11px] font-medium text-emerald-400/90">{arch.subtitle}</p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{arch.desc}</p>

                {/* Specs Box */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className={isActive ? 'text-emerald-400 font-bold' : (exists ? 'text-teal-400 font-semibold' : 'text-slate-400')}>
                      {isActive ? 'Active' : (exists ? 'Trained (.keras)' : (arch.details?.isTheoretical ? 'Benchmark' : 'Pending'))}
                    </span>
                  </div>
                  {arch.details?.size_mb && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Size:</span>
                      <span className="text-slate-300 font-mono">{arch.details.size_mb} MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: View Details -> on all cards, with switch option if trained */}
              <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => setSelectedModel(arch)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Details</span>
                  <span>&rarr;</span>
                </button>
                {exists && !isActive && (
                  <button
                    onClick={() => handleSwitch(arch.key)}
                    disabled={switching}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    title="Switch to this model"
                  >
                    <Play className="w-3 h-3" />
                    <span>Switch</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CLI Training Instructions */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span>Windows CLI Training Commands</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          To generate or retrain candidate model weights from prepared data, execute the following commands in PowerShell:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 space-y-2 border border-slate-800 overflow-x-auto">
          <p className="text-slate-500"># Train Custom CNN baseline (20 epochs)</p>
          <p>python ml/src/train.py --model cnn --epochs 20 --batch-size 32</p>
          
          <p className="text-slate-500 pt-2"># Train EfficientNetB0 transfer learning (ImageNet weights)</p>
          <p>python ml/src/train.py --model efficientnet --epochs 20 --batch-size 32</p>

          <p className="text-slate-500 pt-2"># Evaluate both models on test set &amp; select best_model.keras</p>
          <p>python ml/src/evaluate.py --model both</p>
        </div>
      </div>

      {/* Professional Model Details Modal */}
      {selectedModel && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedModel(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="model-details-title"
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${selectedModel.color}`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="model-details-title" className="text-lg font-bold text-white tracking-tight">
                    {selectedModel.name}
                  </h2>
                  <p className="text-xs font-medium text-emerald-400/90">
                    {selectedModel.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 shrink-0">
                {renderModalStatusBadge(selectedModel)}
                <button
                  onClick={() => setSelectedModel(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
              {/* Category & Description Card */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Architecture &amp; Description
                  </span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium">
                    {selectedModel.fullDesc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Network Structure:
                    </span>
                    <p className="text-slate-300 mt-0.5">{selectedModel.architecture}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Intended Purpose:
                    </span>
                    <p className="text-slate-300 mt-0.5">{selectedModel.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Status & Deployment Distinction Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Deployment Distinction
                </span>
                {isModelActive(selectedModel) ? (
                  <p className="text-emerald-300 text-xs flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Active Inference Engine:</strong> This model is loaded into backend memory. Real-time predictions on the Assessment page are processed through this model.
                    </span>
                  </p>
                ) : selectedModel.details?.exists ? (
                  <p className="text-teal-300 text-xs flex items-start gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Trained Checkpoint Available:</strong> Model weights exist in <code className="text-teal-200">ml/models/</code>. You can switch active inference to this architecture using the button below.
                    </span>
                  </p>
                ) : selectedModel.key === 'efficientnet' ? (
                  <p className="text-amber-300 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pending Training:</strong> This transfer learning architecture is defined in the ML pipeline (<code className="text-amber-200">ml/src/models.py</code>), but no trained <code className="text-amber-200">.keras</code> checkpoint is currently saved on this machine.
                    </span>
                  </p>
                ) : (
                  <p className="text-cyan-300 text-xs flex items-start gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Benchmark Architecture Reference:</strong> Referenced for comparative computer vision analysis. This architecture is not actively compiled or used for predictions in this deployment.
                    </span>
                  </p>
                )}
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Model Status</span>
                  <span className="text-xs font-bold text-white mt-1 block">
                    {isModelActive(selectedModel)
                      ? 'Active'
                      : selectedModel.details?.exists
                      ? 'Trained (.keras)'
                      : selectedModel.details?.isTheoretical
                      ? 'Benchmark'
                      : 'Pending'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Input Dimensions</span>
                  <span className="text-xs font-mono font-medium text-slate-200 mt-1 block">
                    {selectedModel.details?.input_shape
                      ? selectedModel.details.input_shape.join(' × ')
                      : selectedModel.inputShape}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">File Size</span>
                  <span className="text-xs font-mono font-medium text-slate-200 mt-1 block">
                    {selectedModel.details?.size_mb
                      ? `${selectedModel.details.size_mb} MB`
                      : 'Not saved locally'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Checkpoint File</span>
                  <span className="text-xs font-mono text-slate-300 mt-1 block truncate" title={selectedModel.details?.filename || 'None'}>
                    {selectedModel.details?.filename || 'None (Reference)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Parameter Scale</span>
                  <span className="text-xs font-medium text-slate-300 mt-1 block">
                    {selectedModel.parameters}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Classification Target</span>
                  <span className="text-xs font-medium text-slate-300 mt-1 block">
                    Fresh vs. Spoiled (Binary)
                  </span>
                </div>
              </div>

              {/* Verified Evaluation Metrics (ONLY if real metrics exist) */}
              {selectedModel.details?.metrics && Object.keys(selectedModel.details.metrics).length > 0 ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Verified Evaluation Metrics
                    </span>
                    <span className="text-[10px] text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Validation Set Logs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedModel.details.metrics.accuracy !== undefined && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Accuracy</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {(selectedModel.details.metrics.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedModel.details.metrics.macro_f1 !== undefined && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Macro F1</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">
                          {(selectedModel.details.metrics.macro_f1 * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedModel.details.metrics.fresh_f1 !== undefined && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Fresh F1</span>
                        <span className="text-sm font-bold text-teal-400 font-mono">
                          {(selectedModel.details.metrics.fresh_f1 * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedModel.details.metrics.spoiled_f1 !== undefined && (
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Spoiled F1</span>
                        <span className="text-sm font-bold text-rose-400 font-mono">
                          {(selectedModel.details.metrics.spoiled_f1 * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Real metrics loaded from verified checkpoint evaluation in <code>ml/models/</code>.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    No Performance Metrics Recorded
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedModel.key === 'efficientnet'
                      ? 'Evaluation metrics will appear once EfficientNetB0 is trained and evaluated using the training script.'
                      : 'This architecture is an uncompiled reference benchmark. In accordance with data integrity guidelines, no unverified benchmarks are fabricated.'}
                  </p>
                </div>
              )}

              {/* Training CLI Snippet (if untrained or EfficientNetB0) */}
              {selectedModel.key === 'efficientnet' && !selectedModel.details?.exists && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <span className="text-[10px] text-slate-500 block font-sans">PowerShell Training Command:</span>
                  <code className="text-emerald-400 text-[11px] block select-all break-all sm:break-normal">
                    python ml/src/train.py --model efficientnet --epochs 20 --batch-size 32
                  </code>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                {selectedModel.details?.exists && !isModelActive(selectedModel) ? (
                  <button
                    onClick={async () => {
                      await handleSwitch(selectedModel.key);
                      setSelectedModel(null);
                    }}
                    disabled={switching}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Switch Active Model to {selectedModel.name}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 text-center sm:text-left block">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Esc</kbd> to close
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedModel(null)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
