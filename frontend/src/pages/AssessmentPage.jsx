import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Sparkles, 
  Database,
  ExternalLink,
  X,
  BarChart3
} from 'lucide-react';
import { predictFoodQuality, getImageUrl, switchModel } from '../services/api';
import CameraModal from '../components/CameraModal';
import FoodSafetyDisclaimer from '../components/FoodSafetyDisclaimer';

export default function AssessmentPage({ onPredictionSuccess, modelsInfo, onNavigateTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeModel, setActiveModel] = useState(modelsInfo?.active_model || 'best');
  const fileInputRef = useRef(null);

  const handleFileSelection = (file) => {
    if (!file) return;
    setErrorMessage(null);
    setPredictionResult(null);

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Selected file exceeds the maximum 10 MB limit.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setPredictionResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModelSwitch = async (modelName) => {
    setActiveModel(modelName);
    try {
      await switchModel(modelName);
    } catch (err) {
      console.warn('Model switch attempt:', err);
    }
  };

  const handleSubmitAnalysis = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setPredictionResult(null);

    try {
      const result = await predictFoodQuality(selectedFile);
      setPredictionResult(result);
      if (onPredictionSuccess) {
        onPredictionSuccess(result);
      }
    } catch (err) {
      console.error('Classification error:', err);
      const detail = err.response?.data?.detail || err.message || 'Classification failed.';
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Food Quality Assessment</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload or capture a food produce image for automated freshness evaluation.
        </p>
      </div>

      {/* Model Selection Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5 text-sm text-slate-300">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">Active Inference Model:</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          {['best', 'cnn', 'efficientnet'].map((modelKey) => (
            <button
              key={modelKey}
              onClick={() => handleModelSwitch(modelKey)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeModel === modelKey
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {modelKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Upload & Preview Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Zone */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center min-h-[320px] ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : previewUrl
                ? 'border-slate-700 bg-slate-900/40'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full max-w-sm aspect-square rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleClear}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-slate-950/80 backdrop-blur-sm text-[11px] text-slate-300 truncate">
                  {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">Drag and drop produce image</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG, or WebP up to 10 MB</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    Browse Local File
                  </button>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Open Camera
                  </button>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleClear}
              disabled={!selectedFile || isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={handleSubmitAnalysis}
              disabled={!selectedFile || isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Classifying Produce...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Food Quality
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">Assessment Notice</p>
                <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
                {errorMessage.includes('not loaded') && (
                  <p className="text-xs font-mono bg-slate-950 px-2 py-1 rounded text-slate-400 mt-2">
                    Run: python ml/src/train.py --model both
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results Card */}
        <div className="lg:col-span-5">
          {predictionResult ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Classification Outcome
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5" />
                  ID #{predictionResult.id || 'N/A'}
                </span>
              </div>

              {/* Status Badge */}
              <div
                className={`p-5 rounded-2xl border flex items-center gap-4 ${
                  predictionResult.predicted_class === 'Fresh'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    predictionResult.predicted_class === 'Fresh'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {predictionResult.predicted_class === 'Fresh' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">
                    {predictionResult.predicted_class}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Confidence: <strong className="text-white">{predictionResult.confidence_percentage}</strong>
                  </p>
                </div>
              </div>

              {/* Confidence Bars */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Probability Distribution
                </p>
                {Object.entries(predictionResult.probabilities || {}).map(([clsName, prob]) => {
                  const isWinner = clsName === predictionResult.predicted_class;
                  const pct = (prob * 100).toFixed(1);
                  return (
                    <div key={clsName} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-medium ${isWinner ? 'text-white font-bold' : 'text-slate-400'}`}>
                          {clsName}
                        </span>
                        <span className="text-slate-400 font-mono">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            clsName === 'Fresh'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-rose-500 to-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inference Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Latency</span>
                  <span className="text-slate-300 font-mono font-medium flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {predictionResult.latency_ms} ms
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Model Architecture</span>
                  <span className="text-slate-300 font-medium truncate block mt-0.5">
                    {predictionResult.model_name}
                  </span>
                </div>
              </div>
 
              {/* Quick Navigation to History & Analytics */}
              {onNavigateTab && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onNavigateTab('history')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    View in History
                  </button>
                  <button
                    onClick={() => onNavigateTab('analytics')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    View in Analytics
                  </button>
                </div>
              )}

              {/* Compact Disclaimer */}
              <FoodSafetyDisclaimer compact />
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center text-slate-500 flex flex-col items-center justify-center min-h-[320px]">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Awaiting Assessment</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Upload or capture a food photo to inspect visual quality, probability distribution, and classification metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WebRTC Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileSelection}
      />
    </div>
  );
}
