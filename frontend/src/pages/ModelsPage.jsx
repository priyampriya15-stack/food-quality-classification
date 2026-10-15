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
      key: 'best',
      name: 'Best Selected Model',
      badge: 'Production Default',
      desc: 'Selected based on highest validation/test macro-F1 score with latency tie-breaker.',
      details: modelsInfo?.models_details?.best,
    },
    {
      key: 'cnn',
      name: 'Custom 4-Stage CNN Baseline',
      badge: 'Convolutional Network',
      desc: 'Custom deep CNN with Conv2D blocks (32-256 filters), BatchNormalization, Dropout (0.2-0.4), and Global Average Pooling.',
      details: modelsInfo?.models_details?.cnn,
    },
    {
      key: 'efficientnet',
      name: 'EfficientNetB0 Transfer Learning',
      badge: 'Pretrained Backbone',
      desc: 'ImageNet pretrained feature extractor with fine-tuning head and compound scaling optimized for fine visual produce inspection.',
      details: modelsInfo?.models_details?.efficientnet,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Deep Learning Models</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspection, checkpoint status, and runtime architecture selection.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Model Status
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

      {/* Models Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {architectures.map((arch) => {
          const isActive = modelsInfo?.active_model === arch.key;
          const exists = arch.details?.exists ?? false;

          return (
            <div
              key={arch.key}
              className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {arch.badge}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white">{arch.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{arch.desc}</p>

                {/* Specs Box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Input Shape:</span>
                    <span className="text-slate-300 font-mono">224 × 224 × 3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Checkpoint Status:</span>
                    <span className={exists ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                      {exists ? 'Trained (.keras)' : 'Pending Training'}
                    </span>
                  </div>
                  {arch.details?.size_mb && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <span className="text-slate-300 font-mono">{arch.details.size_mb} MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-5 mt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleSwitch(arch.key)}
                  disabled={isActive || switching || !exists}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : exists
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:scale-[1.02]'
                      : 'bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  {isActive ? 'Currently Active' : exists ? `Switch to ${arch.key.toUpperCase()}` : 'Model Not Available'}
                </button>
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
