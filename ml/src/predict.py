"""Single-image and Batch Inference Module for Food Quality Classification.

Loads a saved Keras model and its metadata, validates image format/integrity,
executes inference, and outputs class probabilities with the mandatory safety disclaimer.
Designed for both standalone CLI execution and direct integration into FastAPI backend.
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
from PIL import Image, UnidentifiedImageError
import tensorflow as tf

# Import dataset configuration and model utilities
try:
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        SUPPORTED_EXTENSIONS,
    )
    from ml.src.model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        load_model_metadata,
        resolve_model_path,
    )
except ImportError:
    from dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        SUPPORTED_EXTENSIONS,
    )
    from model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        load_model_metadata,
        resolve_model_path,
    )

logger = logging.getLogger("predict")

# Cache loaded models in memory for fast repeated inference
_MODEL_CACHE: Dict[str, Tuple[tf.keras.Model, Dict[str, Any]]] = {}


def load_inference_model(
    model_identifier: str = "best",
    models_dir: Path = MODELS_DIR,
) -> Tuple[tf.keras.Model, Dict[str, Any], Path]:
    """Load model and metadata with caching.
    
    Raises:
        FileNotFoundError: If model file does not exist.
    """
    model_path, meta_path = resolve_model_path(model_identifier, models_dir)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model artifact not found at: '{model_path}'. "
            "Please train the model first using 'python ml/src/train.py'."
        )

    cache_key = str(model_path.resolve())
    if cache_key in _MODEL_CACHE:
        model, metadata = _MODEL_CACHE[cache_key]
        return model, metadata, model_path

    logger.info(f"Loading inference model from: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    metadata: Dict[str, Any] = {}
    if meta_path.exists():
        try:
            metadata = load_model_metadata(meta_path)
        except Exception as e:
            logger.warning(f"Could not load metadata from {meta_path}: {e}")

    # Fallback mappings if metadata is absent
    if "idx_to_class" not in metadata:
        metadata["idx_to_class"] = {0: "Fresh", 1: "Spoiled"}
    else:
        # Convert stringified keys to ints
        metadata["idx_to_class"] = {
            int(k): v for k, v in metadata["idx_to_class"].items()
        }

    _MODEL_CACHE[cache_key] = (model, metadata)
    return model, metadata, model_path


def preprocess_image_file(
    image_path: Union[str, Path],
    target_size: Tuple[int, int] = IMAGE_SIZE,
) -> Tuple[np.ndarray, Tuple[int, int]]:
    """Validate and preprocess an image file into a batch tensor.
    
    Returns:
        (preprocessed_tensor_batch, original_dimensions)
        
    Raises:
        FileNotFoundError: If image does not exist.
        ValueError: If file is empty, corrupted, or unsupported.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found at: {path}")

    if path.stat().st_size == 0:
        raise ValueError(f"Image file is empty (0 bytes): {path}")

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file format '{path.suffix}'. "
            f"Supported extensions: {SUPPORTED_EXTENSIONS}"
        )

    try:
        # Open and convert to RGB (handles RGBA, Grayscale, CMYK gracefully)
        with Image.open(path) as raw_img:
            raw_img.verify()

        with Image.open(path) as img:
            original_size = img.size  # (width, height)
            rgb_img = img.convert("RGB")
            # Resize with bilinear interpolation
            resized_img = rgb_img.resize(target_size, Image.Resampling.BILINEAR)
            img_array = np.array(resized_img, dtype=np.float32)

            # Expand to batch dimension: (1, 224, 224, 3)
            img_batch = np.expand_dims(img_array, axis=0)

            return img_batch, original_size

    except (UnidentifiedImageError, OSError) as e:
        raise ValueError(f"Corrupted or unreadable image file: {e}") from e


def predict_image(
    image_path: Union[str, Path],
    model_identifier: str = "best",
    models_dir: Path = MODELS_DIR,
) -> Dict[str, Any]:
    """Execute quality prediction on a single food image.
    
    Returns:
        Dictionary containing predicted_class, confidence, probabilities,
        latency_ms, model_name, and safety disclaimer.
    """
    path = Path(image_path)
    model, metadata, resolved_path = load_inference_model(model_identifier, models_dir)

    target_size = tuple(metadata.get("input_shape", list(IMAGE_SIZE) + [3])[:2])
    idx_to_class = metadata.get("idx_to_class", {0: "Fresh", 1: "Spoiled"})

    # Preprocess image
    start_time = time.perf_counter()
    img_batch, original_dimensions = preprocess_image_file(path, target_size=target_size)

    # Run inference
    predictions = model.predict(img_batch, verbose=0)
    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    # Extract probabilities
    probs = predictions[0]
    pred_idx = int(np.argmax(probs))
    pred_class = idx_to_class.get(pred_idx, f"Class_{pred_idx}")
    confidence = float(probs[pred_idx])

    probabilities: Dict[str, float] = {}
    for idx, prob in enumerate(probs):
        cls_label = idx_to_class.get(idx, f"Class_{idx}")
        probabilities[cls_label] = round(float(prob), 4)

    return {
        "image_path": str(path.resolve()),
        "image_filename": path.name,
        "original_dimensions": {
            "width": original_dimensions[0],
            "height": original_dimensions[1],
        },
        "predicted_class": pred_class,
        "confidence": round(confidence, 4),
        "confidence_percentage": f"{confidence * 100:.1f}%",
        "probabilities": probabilities,
        "latency_ms": latency_ms,
        "model_architecture": metadata.get("architecture", resolved_path.stem),
        "model_file": resolved_path.name,
        "food_safety_disclaimer": FOOD_SAFETY_DISCLAIMER,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Predict food quality (Fresh vs. Spoiled) from image.")
    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to food image file",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="best",
        help="Model identifier ('best', 'cnn', 'efficientnet', or custom path)",
    )
    parser.add_argument(
        "--models-dir",
        type=str,
        default=str(MODELS_DIR),
        help="Path to models directory",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON instead of formatted text",
    )

    args = parser.parse_args()

    try:
        result = predict_image(
            image_path=args.image,
            model_identifier=args.model,
            models_dir=Path(args.models_dir),
        )

        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print("\n" + "=" * 50)
            print(f"FOOD QUALITY PREDICTION RESULT")
            print("=" * 50)
            print(f"Image:            {result['image_filename']}")
            print(f"Predicted Class:  {result['predicted_class']}")
            print(f"Confidence:       {result['confidence_percentage']}")
            print(f"Latency:          {result['latency_ms']} ms")
            print(f"Model:            {result['model_file']} ({result['model_architecture']})")
            print("\nClass Probabilities:")
            for cls_name, prob in result["probabilities"].items():
                bar = "#" * int(prob * 20)
                print(f"  {cls_name:<10}: {prob:.4f} [{bar:<20}]")
            print("\n" + "-" * 50)
            print("SAFETY DISCLAIMER:")
            print(result["food_safety_disclaimer"])
            print("=" * 50 + "\n")

        return 0

    except FileNotFoundError as e:
        print(f"\n[ERROR] File not found: {e}")
        return 1
    except ValueError as e:
        print(f"\n[ERROR] Invalid input: {e}")
        return 1
    except Exception as e:
        print(f"\n[FATAL ERROR] Prediction failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
