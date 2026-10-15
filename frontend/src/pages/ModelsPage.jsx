import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Layers, Play, Terminal, Info, RefreshCw } from 'lucide-react';
import { switchModel } from '../services/api';

export default function ModelsPage({ modelsInfo, onRefresh }) {
  const [switching, setSwitching] = useState(false);
  const [switchMessage, setSwitchMessage] = useState(null);

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

  const architectures = [
    {
      key: 'vgg16',
      name: 'VGG16',
      subtitle: 'Image Classification',
      desc: 'High accuracy, proven reliability.',
      badge: 'Deep Architecture',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      details: { exists: false, isTheoretical: true },
    },
    {
      key: 'resnet50',
      name: 'ResNet50',
      subtitle: 'Feature Extraction',
      desc: 'Better feature representation.',
      badge: 'Residual Network',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      details: { exists: false, isTheoretical: true },
    },
    {
      key: 'efficientnet',
      name: 'EfficientNetB0',
      subtitle: 'Lightweight & Fast',
      desc: 'Optimal performance vs size.',
      badge: 'Pretrained Backbone',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      details: modelsInfo?.models_details?.efficientnet,
    },
    {
      key: 'cnn',
      name: 'Custom Model',
      subtitle: 'Food Quality Classifier',
      desc: 'Trained on food dataset.',
      badge: 'Custom CNN',
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      details: modelsInfo?.models_details?.cnn,
    },
  ];

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
          const isActive = modelsInfo?.active_model === arch.key || (arch.key === 'cnn' && modelsInfo?.active_model === 'best');
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
                    <span className={exists ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                      {exists ? 'Trained (.keras)' : (arch.details?.isTheoretical ? 'Benchmark' : 'Pending')}
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

              {/* Action Button: View Details -> or Switch */}
              <div className="pt-4 mt-3 border-t border-slate-800/80">
                {exists ? (
                  <button
                    onClick={() => handleSwitch(arch.key)}
                    disabled={isActive || switching}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    }`}
                  >
                    <span>{isActive ? 'Active Model' : 'Switch Model'}</span>
                    <Play className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`${arch.name} (${arch.subtitle}): Standard computer vision architecture referenced for benchmarking visual food classification.`)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <span>&rarr;</span>
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
    </div>
  );
}
