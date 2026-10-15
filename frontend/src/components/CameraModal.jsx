import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture }) {
  const [stream, setStream] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setCapturedBlob(null);
    setPreviewUrl(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera initialization failed:', err);
      setCameraError(err.message || 'Unable to access camera. Check device permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
        }
      },
      'image/jpeg',
      0.95,
    );
  };

  const handleConfirm = () => {
    if (capturedBlob) {
      const file = new File([capturedBlob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 xs:p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span>Capture Food Photo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center text-rose-400 text-sm max-w-xs flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p>{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Retry Camera
              </button>
            </div>
          ) : previewUrl ? (
            <img src={previewUrl} alt="Captured snapshot" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Guide Overlay */}
          {!previewUrl && !cameraError && (
            <div className="absolute inset-8 border-2 border-emerald-500/40 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-emerald-300/80 bg-slate-950/70 px-2 py-1 rounded">
                Center produce inside frame
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4">
          {previewUrl ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
              >
                <CheckCircle className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <button
              onClick={takeSnapshot}
              disabled={!!cameraError}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            >
              <Camera className="w-4 h-4" />
              Capture Snapshot
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
