"""Backend Prediction Service for Food Quality Assessment.

Manages model lifecycle (loading, caching, switching), in-memory image validation,
inference execution via Phase 3 ML pipeline, and web-safe image persistence.
"""

import io
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image, UnidentifiedImageError

from backend.app.core.config import settings

logger = logging.getLogger("prediction_service")

# Mandatory food safety disclaimer
FOOD_SAFETY_DISCLAIMER = (
    "This model estimates visual similarity to Fresh and Spoiled training labels. "
    "Its predictions and confidence scores do not establish microbiological safety, "
    "contamination, toxicity, or suitability for consumption. Do not rely on this "
    "system as the sole basis for food safety decisions."
)


class PredictionService:
    """Singleton service for food quality assessment inference."""

    def __init__(
        self,
        models_dir: Optional[Union[str, Path]] = None,
        default_model: Optional[str] = None,
    ):
        self.models_dir = Path(models_dir) if models_dir else settings.models_path
        self.active_model_name = default_model or settings.DEFAULT_MODEL
        self._loaded_model = None
        self._loaded_metadata: Dict[str, Any] = {}
        self._model_path: Optional[Path] = None
        self._is_loaded = False

    def get_model_status(self) -> Dict[str, Any]:
        """Return model availability and service readiness dictionary."""
        available = self.get_available_models()
        return {
            "service_ready": len(available) > 0,
            "active_model": self.active_model_name,
            "is_loaded": self._is_loaded,
            "available_models": available,
            "models_details": self.get_model_details(),
        }

    def is_model_available(self, model_name: Optional[str] = None) -> bool:
        """Check if target model .keras file exists on disk."""
        target = model_name or self.active_model_name
        try:
            from ml.src.model_utils import resolve_model_path
            model_file, _ = resolve_model_path(target, self.models_dir)
            return model_file.exists()
        except Exception:
            if target == "best":
                return (self.models_dir / "best_model.keras").exists()
            elif target == "cnn":
                return (self.models_dir / "cnn_best.keras").exists()
            elif target == "efficientnet":
                return (self.models_dir / "efficientnet_best.keras").exists()
            return (self.models_dir / f"{target}.keras").exists()

    def get_available_models(self) -> List[str]:
        """List all valid candidate models discovered in models directory."""
        candidates = ["best", "cnn", "efficientnet"]
        available: List[str] = []
        for name in candidates:
            if self.is_model_available(name):
                available.append(name)
        return available

    def get_model_details(self) -> Dict[str, Any]:
        """Return metadata for all available models."""
        from ml.src.model_utils import resolve_model_path, load_model_metadata

        details: Dict[str, Any] = {}
        for name in ["best", "cnn", "efficientnet"]:
            model_file, meta_file = resolve_model_path(name, self.models_dir)
            if model_file.exists():
                meta = {}
                if meta_file.exists():
                    try:
                        meta = load_model_metadata(meta_file)
                    except Exception:
                        pass
                details[name] = {
                    "exists": True,
                    "filename": model_file.name,
                    "size_mb": round(model_file.stat().st_size / (1024 * 1024), 2),
                    "architecture": meta.get("architecture", name),
                    "created_at": meta.get("created_at") or meta.get("selected_at"),
                    "metrics": meta.get("evaluation_metrics") or meta.get("winner_metrics", {}),
                    "input_shape": meta.get("input_shape", [224, 224, 3]),
                }
            else:
                details[name] = {
                    "exists": False,
                    "filename": model_file.name,
                    "message": "Model not trained yet",
                }
        return details

    def load_active_model(self) -> bool:
        """Load the active model into memory if available."""
        if not self.is_model_available(self.active_model_name):
            logger.warning(
                f"Active model '{self.active_model_name}' not found in '{self.models_dir}'. "
                "Inference will be unavailable until models are trained."
            )
            self._loaded_model = None
            self._is_loaded = False
            return False

        try:
            from ml.src.predict import load_inference_model
            model, metadata, model_path = load_inference_model(
                self.active_model_name,
                self.models_dir,
            )
            self._loaded_model = model
            self._loaded_metadata = metadata
            self._model_path = model_path
            self._is_loaded = True
            logger.info(f"Loaded active model: {model_path.name}")
            return True
        except Exception as e:
            logger.error(f"Error loading model '{self.active_model_name}': {e}")
            self._is_loaded = False
            return False

    def switch_model(self, target_model_name: str) -> Tuple[bool, str]:
        """Switch active model architecture."""
        clean_name = target_model_name.strip().lower()
        if clean_name not in ("best", "cnn", "efficientnet"):
            return False, f"Invalid model identifier '{clean_name}'. Must be 'best', 'cnn', or 'efficientnet'."

        if not self.is_model_available(clean_name):
            return False, f"Model '{clean_name}' is not trained or missing in '{self.models_dir}'."

        self.active_model_name = clean_name
        loaded = self.load_active_model()
        if loaded:
            return True, f"Successfully switched active model to '{clean_name}'."
        return False, f"Failed to load model '{clean_name}' into memory."

    def validate_and_preprocess_image(
        self,
        image_bytes: bytes,
        filename: str,
    ) -> Tuple[np.ndarray, Tuple[int, int]]:
        """Validate raw uploaded image bytes and resize to model dimensions.
        
        Raises:
            ValueError: If file is empty, corrupted, or unsupported.
        """
        # 1. Size constraint
        if len(image_bytes) == 0:
            raise ValueError("Uploaded file is completely empty (0 bytes).")

        if len(image_bytes) > settings.max_upload_size_bytes:
            max_mb = settings.MAX_UPLOAD_SIZE_MB
            raise ValueError(f"Uploaded file exceeds maximum size limit of {max_mb} MB.")

        # 2. Extension check
        ext = Path(filename).suffix.lower().lstrip(".")
        if ext not in settings.ALLOWED_EXTENSIONS:
            allowed = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise ValueError(f"Unsupported image format '.{ext}'. Allowed formats: {allowed}")

        # 3. Integrity verification with Pillow
        try:
            byte_stream = io.BytesIO(image_bytes)
            with Image.open(byte_stream) as raw_img:
                raw_img.verify()

            # Re-read image stream for actual decoding
            byte_stream.seek(0)
            with Image.open(byte_stream) as img:
                orig_w, orig_h = img.size
                if orig_w <= 0 or orig_h <= 0:
                    raise ValueError(f"Invalid image dimensions: {orig_w}x{orig_h}")

                # Convert to RGB (normalizes Grayscale, RGBA, CMYK)
                rgb_img = img.convert("RGB")
                # Resize to target 224x224
                target_size = (224, 224)
                if self._loaded_metadata and "input_shape" in self._loaded_metadata:
                    target_size = tuple(self._loaded_metadata["input_shape"][:2])

                resized = rgb_img.resize(target_size, Image.Resampling.BILINEAR)
                img_array = np.array(resized, dtype=np.float32)

                # Expand batch dimension: (1, 224, 224, 3)
                img_batch = np.expand_dims(img_array, axis=0)

                return img_batch, (orig_w, orig_h)

        except (UnidentifiedImageError, OSError) as e:
            raise ValueError(f"Image is corrupted or cannot be decoded: {str(e)}") from e

    def save_uploaded_image(self, image_bytes: bytes, original_filename: str) -> Optional[str]:
        """Save image with secure UUID into uploads directory and return web-safe relative path."""
        if not settings.PERSIST_PREDICTION_IMAGES:
            return None

        upload_dir = settings.uploads_path
        upload_dir.mkdir(parents=True, exist_ok=True)

        ext = Path(original_filename).suffix.lower()
        secure_filename = f"pred_{uuid.uuid4().hex[:12]}{ext}"
        target_path = upload_dir / secure_filename

        try:
            with open(target_path, "wb") as f:
                f.write(image_bytes)
            # Return web URL path accessible via static mounting
            return f"/uploads/{secure_filename}"
        except Exception as e:
            logger.error(f"Failed to persist uploaded image: {e}")
            return None

    def predict(
        self,
        image_bytes: bytes,
        filename: str,
    ) -> Dict[str, Any]:
        """Execute full prediction pipeline on uploaded image bytes.
        
        Returns:
            Dictionary matching PredictionResponse schema.
            
        Raises:
            ValueError: If image input is invalid, empty, or corrupt.
            FileNotFoundError: If model artifact is not loaded/found.
        """
        # 1. Validate and preprocess image first (fail-fast on corrupt/empty/unsupported)
        start_time = time.perf_counter()
        img_batch, orig_dimensions = self.validate_and_preprocess_image(image_bytes, filename)

        # 2. Check model loading status
        if not self._is_loaded:
            loaded = self.load_active_model()
            if not loaded or self._loaded_model is None:
                raise FileNotFoundError(
                    f"Inference model '{self.active_model_name}' is not loaded or missing. "
                    "Ensure models are trained in 'ml/models/'."
                )

        # 3. Execute inference
        predictions = self._loaded_model.predict(img_batch, verbose=0)
        latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

        # 3. Extract probabilities
        probs = predictions[0]
        # Ensure finite floats
        probs = np.nan_to_num(probs, nan=0.0, posinf=1.0, neginf=0.0)

        idx_to_class = self._loaded_metadata.get("idx_to_class", {0: "Fresh", 1: "Spoiled"})
        pred_idx = int(np.argmax(probs))
        pred_class = idx_to_class.get(pred_idx, f"Class_{pred_idx}")
        confidence = float(probs[pred_idx])

        probabilities: Dict[str, float] = {}
        for idx, prob in enumerate(probs):
            cls_name = idx_to_class.get(idx, f"Class_{idx}")
            probabilities[cls_name] = round(float(prob), 4)

        # 4. Optional web-safe persistence
        web_image_path = self.save_uploaded_image(image_bytes, filename)

        return {
            "image_filename": filename,
            "image_path": web_image_path,
            "predicted_class": pred_class,
            "confidence": round(confidence, 4),
            "confidence_percentage": f"{confidence * 100:.1f}%",
            "probabilities": probabilities,
            "latency_ms": latency_ms,
            "model_name": self._loaded_metadata.get("architecture", self.active_model_name),
            "disclaimer": FOOD_SAFETY_DISCLAIMER,
        }


# Singleton instance
prediction_service = PredictionService()
