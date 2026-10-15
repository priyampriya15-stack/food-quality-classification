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
        <div className="lg:col-span-6 space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              Upload Food Image
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose an image or drag and drop it here
            </p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center min-h-[260px] sm:min-h-[280px] ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : previewUrl
                ? 'border-slate-700 bg-slate-950/60'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full max-w-xs aspect-square rounded-xl overflow-hidden border border-slate-700 shadow-xl group">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleClear}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white hover:bg-rose-600 transition-colors shadow-lg cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 inset-x-0 p-2 bg-slate-950/85 backdrop-blur-sm text-[11px] text-slate-300 truncate">
                  {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Click to upload or drag and drop</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG (Max 10MB)</p>
                </div>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Browse Local File
                  </button>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
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

          {/* Action Button: Analyze Image */}
          <div className="pt-2">
            <button
              onClick={handleSubmitAnalysis}
              disabled={!selectedFile || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Image
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
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Analysis Result:
              </h2>
              {predictionResult && (
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Database className="w-3.5 h-3.5" />
                  #{predictionResult.id || 'N/A'}
                </span>
              )}
            </div>

            {predictionResult ? (
              <div className="space-y-5">
                {/* Status Badge */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border flex items-center gap-4 ${
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
                <div className="space-y-2.5">
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
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
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
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
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
              </div>
            ) : (
              <div className="py-12 px-4 text-center text-slate-500 flex flex-col items-center justify-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                  <Sparkles className="w-7 h-7 text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Upload an image to get started</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  AI will analyze and predict the food quality
                </p>
              </div>
            )}
          </div>

          {/* 4 Feature Indicator Badges along Bottom (matching reference screenshot) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Freshness</span>
              <span className="text-[11px] font-bold text-emerald-400">Detection</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Contamination</span>
              <span className="text-[11px] font-bold text-cyan-400">Analysis</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Quality</span>
              <span className="text-[11px] font-bold text-emerald-400">Grading</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Confidence</span>
              <span className="text-[11px] font-bold text-cyan-400">Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Food Safety & Limitations Information Panel */}
      <FoodSafetyDisclaimer compact />

      {/* WebRTC Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFileSelection}
      />
    </div>
  );
}
