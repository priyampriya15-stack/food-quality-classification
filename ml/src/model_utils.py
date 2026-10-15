"""Model Utilities for Food Quality Classification.

Provides reproducible seed configuration, metadata generation and serialization,
model path resolution, parameter calculation, and safety disclaimer definitions.
"""

import datetime
import json
import logging
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

# Import base paths
try:
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        ML_DIR,
        RANDOM_SEED,
    )
except ImportError:
    from dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        ML_DIR,
        RANDOM_SEED,
    )

MODELS_DIR = ML_DIR / "models"
REPORTS_DIR = ML_DIR / "reports"

FOOD_SAFETY_DISCLAIMER = (
    "This model estimates visual similarity to Fresh and Spoiled training labels. "
    "Its predictions and confidence scores do not establish microbiological safety, "
    "contamination, toxicity, or suitability for consumption. Do not rely on this "
    "system as the sole basis for food safety decisions."
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("model_utils")


def set_random_seeds(seed: int = RANDOM_SEED) -> None:
    """Set seeds across Python, NumPy, and TensorFlow for reproducibility."""
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    try:
        import tensorflow as tf
        tf.random.set_seed(seed)
        # Attempt deterministic ops where supported
        try:
            tf.config.experimental.enable_op_determinism()
        except Exception as e:
            logger.debug(f"Op determinism warning: {e}")
        logger.info(f"Deterministic random seed configured: {seed}")
    except ImportError:
        logger.warning("TensorFlow not yet imported. Python and NumPy seeds set.")


def get_device_info() -> Dict[str, Any]:
    """Detect available hardware accelerator (GPU/CPU)."""
    try:
        import tensorflow as tf
        gpus = tf.config.list_physical_devices("GPU")
        if gpus:
            return {
                "device_type": "GPU",
                "device_count": len(gpus),
                "device_names": [gpu.name for gpu in gpus],
            }
        return {
            "device_type": "CPU",
            "device_count": 1,
            "device_names": ["CPU:0"],
        }
    except Exception as e:
        return {
            "device_type": "UNKNOWN",
            "error": str(e),
        }


def save_model_metadata(
    model_path: Path,
    architecture_name: str,
    class_to_idx: Dict[str, int],
    hyperparameters: Dict[str, Any],
    metrics: Optional[Dict[str, Any]] = None,
    dataset_info: Optional[Dict[str, Any]] = None,
    metadata_path: Optional[Path] = None,
    extra_info: Optional[Dict[str, Any]] = None,
) -> Path:
    """Generate and write a comprehensive JSON metadata artifact for a trained model.
    
    Contains no credentials or sensitive tokens.
    """
    if metadata_path is None:
        metadata_path = model_path.with_suffix(".json")

    # Invert mapping for quick index-to-class lookup
    idx_to_class = {int(idx): cls_name for cls_name, idx in class_to_idx.items()}

    tf_version = "unknown"
    keras_version = "unknown"
    try:
        import tensorflow as tf
        tf_version = tf.__version__
        keras_version = getattr(tf.keras, "__version__", tf.__version__)
    except Exception:
        pass

    file_size_mb = 0.0
    if model_path.exists():
        file_size_mb = round(model_path.stat().st_size / (1024 * 1024), 2)

    metadata: Dict[str, Any] = {
        "model_file": model_path.name,
        "model_path": str(model_path.resolve()),
        "architecture": architecture_name,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model_size_mb": file_size_mb,
        "input_shape": list(IMAGE_SIZE) + [3],
        "canonical_classes": CANONICAL_CLASSES,
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "hyperparameters": hyperparameters,
        "framework_versions": {
            "tensorflow": tf_version,
            "keras": keras_version,
        },
        "device_info": get_device_info(),
        "dataset_info": dataset_info or {},
        "evaluation_metrics": metrics or {},
        "extra_info": extra_info or {},
        "food_safety_disclaimer": FOOD_SAFETY_DISCLAIMER,
    }

    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"Model metadata written to: {metadata_path}")
    return metadata_path


def load_model_metadata(metadata_path: Path) -> Dict[str, Any]:
    """Load model metadata from JSON with validation."""
    if not metadata_path.exists():
        raise FileNotFoundError(f"Model metadata file not found at: {metadata_path}")

    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "class_to_idx" not in data or "architecture" not in data:
        raise ValueError(f"Corrupt or incomplete model metadata in: {metadata_path}")

    return data


def resolve_model_path(
    model_name_or_path: str,
    models_dir: Path = MODELS_DIR,
) -> Tuple[Path, Path]:
    """Resolve a user-provided model name or file path into model and metadata paths.
    
    Accepts:
      - 'cnn' -> ml/models/cnn_best.keras & ml/models/cnn_best.json
      - 'efficientnet' -> ml/models/efficientnet_best.keras & ml/models/efficientnet_best.json
      - 'best' -> ml/models/best_model.keras & ml/models/best_model_metadata.json
      - Custom path -> custom_path & custom_path.json
    """
    key = model_name_or_path.strip().lower()
    if key == "cnn":
        model_file = models_dir / "cnn_best.keras"
        meta_file = models_dir / "cnn_best.json"
    elif key in ("efficientnet", "efficientnet_b0", "efficientnetb0"):
        model_file = models_dir / "efficientnet_best.keras"
        meta_file = models_dir / "efficientnet_best.json"
    elif key == "best":
        model_file = models_dir / "best_model.keras"
        meta_file = models_dir / "best_model_metadata.json"
    else:
        # Custom file path
        p = Path(model_name_or_path)
        if not p.is_absolute():
            p = models_dir / p
        model_file = p
        meta_file = p.with_suffix(".json")

    return model_file, meta_file


def get_model_size_mb(path: Path) -> float:
    """Return file size in megabytes."""
    if not path.exists():
        return 0.0
    return round(path.stat().st_size / (1024 * 1024), 2)
