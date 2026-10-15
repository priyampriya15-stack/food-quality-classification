"""Model Evaluation and Selection Pipeline for Food Quality Classification.

Evaluates trained CNN and EfficientNetB0 models on the held-out test dataset,
computes precision, recall, macro/weighted F1, confusion matrix, inference latency,
generates training curves and confusion plots, and selects best_model.keras.
"""

import argparse
import json
import logging
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import matplotlib
matplotlib.use("Agg")  # Non-interactive headless backend for rendering plots
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
import tensorflow as tf

# Import ML configuration and utilities
try:
    from ml.src.data_loader import (
        CLASS_TO_INDEX,
        INDEX_TO_CLASS,
        load_dataset_split,
        verify_processed_dataset,
    )
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        REPORTS_DIR,
        TEST_DIR,
    )
    from ml.src.model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        get_model_size_mb,
        load_model_metadata,
        resolve_model_path,
        save_model_metadata,
    )
except ImportError:
    from data_loader import (
        CLASS_TO_INDEX,
        INDEX_TO_CLASS,
        load_dataset_split,
        verify_processed_dataset,
    )
    from dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        REPORTS_DIR,
        TEST_DIR,
    )
    from model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        get_model_size_mb,
        load_model_metadata,
        resolve_model_path,
        save_model_metadata,
    )

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluate")


def plot_training_curves(history_csv_path: Path, output_png_path: Path) -> None:
    """Read training_history.csv and render accuracy and loss progression curves."""
    if not history_csv_path.exists():
        logger.warning(f"Training history CSV not found at: {history_csv_path}. Skipping curves.")
        return

    try:
        df = pd.read_csv(history_csv_path)
        epochs = df["epoch"] + 1 if "epoch" in df.columns else range(1, len(df) + 1)

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        # Accuracy Subplot
        if "accuracy" in df.columns:
            ax1.plot(epochs, df["accuracy"], label="Training Accuracy", color="#10b981", linewidth=2)
        if "val_accuracy" in df.columns:
            ax1.plot(epochs, df["val_accuracy"], label="Validation Accuracy", color="#3b82f6", linewidth=2, linestyle="--")
        ax1.set_title("Training and Validation Accuracy", fontsize=12, fontweight="bold")
        ax1.set_xlabel("Epoch")
        ax1.set_ylabel("Accuracy")
        ax1.grid(True, linestyle=":", alpha=0.6)
        ax1.legend(loc="lower right")

        # Loss Subplot
        if "loss" in df.columns:
            ax2.plot(epochs, df["loss"], label="Training Loss", color="#ef4444", linewidth=2)
        if "val_loss" in df.columns:
            ax2.plot(epochs, df["val_loss"], label="Validation Loss", color="#f59e0b", linewidth=2, linestyle="--")
        ax2.set_title("Training and Validation Loss", fontsize=12, fontweight="bold")
        ax2.set_xlabel("Epoch")
        ax2.set_ylabel("Loss")
        ax2.grid(True, linestyle=":", alpha=0.6)
        ax2.legend(loc="upper right")

        output_png_path.parent.mkdir(parents=True, exist_ok=True)
        plt.tight_layout()
        plt.savefig(output_png_path, dpi=200)
        plt.close(fig)
        logger.info(f"Saved training curves to: {output_png_path}")
    except Exception as e:
        logger.error(f"Failed to generate training curves: {e}")


def plot_confusion_matrix(cm: np.ndarray, class_names: List[str], output_png_path: Path) -> None:
    """Render and save a normalized and count confusion matrix heatmap."""
    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(cm, cmap="Blues", alpha=0.85)

    fig.colorbar(cax)

    # Set axis ticks and labels
    ax.set_xticks(range(len(class_names)))
    ax.set_yticks(range(len(class_names)))
    ax.set_xticklabels(class_names, fontsize=10, fontweight="bold")
    ax.set_yticklabels(class_names, fontsize=10, fontweight="bold")
    ax.tick_params(top=False, bottom=True, labeltop=False, labelbottom=True)

    total_samples = np.sum(cm)

    # Annotate cells with count and percentage
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            count = cm[i, j]
            pct = (count / total_samples * 100) if total_samples > 0 else 0
            color = "white" if count > (cm.max() / 2) else "black"
            ax.text(
                j, i,
                f"{count}\n({pct:.1f}%)",
                ha="center", va="center",
                color=color,
                fontsize=11, fontweight="bold",
            )

    plt.title("Confusion Matrix (Held-out Test Set)", fontsize=12, fontweight="bold", pad=15)
    plt.xlabel("Predicted Quality Class", fontsize=10, fontweight="bold", labelpad=10)
    plt.ylabel("Ground Truth Class", fontsize=10, fontweight="bold", labelpad=10)

    output_png_path.parent.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    plt.savefig(output_png_path, dpi=200)
    plt.close(fig)
    logger.info(f"Saved confusion matrix plot to: {output_png_path}")


def evaluate_single_model(
    model_path: Path,
    metadata_path: Path,
    test_ds: tf.data.Dataset,
    output_dir: Path,
) -> Dict[str, Any]:
    """Execute complete evaluation of a trained model against the held-out test split."""
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found at: {model_path}")

    logger.info(f"Loading model for evaluation: {model_path}")
    model = tf.keras.models.load_model(str(model_path))

    # Load associated metadata if present
    metadata = {}
    if metadata_path.exists():
        metadata = load_model_metadata(metadata_path)

    # Collect ground truths and measure inference latency
    all_true_labels: List[int] = []
    all_pred_probs: List[np.ndarray] = []
    latencies: List[float] = []

    logger.info("Computing predictions on held-out test set...")
    for images, labels in test_ds:
        all_true_labels.extend(labels.numpy())

        batch_start = time.perf_counter()
        probs = model.predict(images, verbose=0)
        batch_end = time.perf_counter()

        batch_size = images.shape[0]
        per_image_ms = ((batch_end - batch_start) / batch_size) * 1000.0
        latencies.extend([per_image_ms] * batch_size)
        all_pred_probs.append(probs)

    y_true = np.array(all_true_labels)
    y_prob = np.concatenate(all_pred_probs, axis=0)
    y_pred = np.argmax(y_prob, axis=1)

    # Calculate Scikit-learn metrics
    report_dict = classification_report(
        y_true,
        y_pred,
        target_names=CANONICAL_CLASSES,
        output_dict=True,
        zero_division=0,
    )
    report_text = classification_report(
        y_true,
        y_pred,
        target_names=CANONICAL_CLASSES,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred, labels=range(len(CANONICAL_CLASSES)))

    avg_latency_ms = round(float(np.mean(latencies)), 2) if latencies else 0.0
    model_size_mb = get_model_size_mb(model_path)

    logger.info(f"\nClassification Report for {model_path.name}:\n{report_text}")

    # Generate plots
    output_dir.mkdir(parents=True, exist_ok=True)
    cm_plot_path = output_dir / "confusion_matrix.png"
    plot_confusion_matrix(cm, CANONICAL_CLASSES, cm_plot_path)

    history_csv = output_dir / "training_history.csv"
    if history_csv.exists():
        curves_plot_path = output_dir / "training_curves.png"
        plot_training_curves(history_csv, curves_plot_path)

    # Compile structured report JSON
    eval_summary: Dict[str, Any] = {
        "model_file": model_path.name,
        "evaluation_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "test_samples_count": len(y_true),
        "test_accuracy": float(report_dict.get("accuracy", 0.0)),
        "macro_precision": float(report_dict.get("macro avg", {}).get("precision", 0.0)),
        "macro_recall": float(report_dict.get("macro avg", {}).get("recall", 0.0)),
        "macro_f1": float(report_dict.get("macro avg", {}).get("f1-score", 0.0)),
        "weighted_f1": float(report_dict.get("weighted avg", {}).get("f1-score", 0.0)),
        "per_class_metrics": {
            cls: report_dict.get(cls, {}) for cls in CANONICAL_CLASSES
        },
        "confusion_matrix": cm.tolist(),
        "canonical_classes": CANONICAL_CLASSES,
        "class_to_idx": CLASS_TO_INDEX,
        "average_inference_latency_ms": avg_latency_ms,
        "model_file_size_mb": model_size_mb,
        "food_safety_disclaimer": FOOD_SAFETY_DISCLAIMER,
    }

    report_json_path = output_dir / "classification_report.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(eval_summary, f, indent=2)
    logger.info(f"Classification report saved to: {report_json_path}")

    return eval_summary


def select_best_model(
    model_evaluations: Dict[str, Dict[str, Any]],
    models_dir: Path = MODELS_DIR,
    reports_dir: Path = REPORTS_DIR,
) -> Optional[str]:
    """Select superior model using validation macro-F1 (or test macro-F1 as measured).
    
    Copies winning checkpoint to best_model.keras and writes best_model_metadata.json.
    """
    if not model_evaluations:
        logger.warning("No model evaluations available for selection.")
        return None

    # Model selection criterion: macro F1-score descending, latency ascending
    sorted_models = sorted(
        model_evaluations.items(),
        key=lambda item: (
            item[1].get("macro_f1", 0.0),
            -item[1].get("average_inference_latency_ms", 999.0),
        ),
        reverse=True,
    )

    winner_name, winner_metrics = sorted_models[0]
    logger.info(
        f"\n{'='*60}\n"
        f"MODEL SELECTION WINNER: '{winner_name}'\n"
        f"Selected by Macro F1: {winner_metrics.get('macro_f1', 0.0):.4f} "
        f"(Accuracy: {winner_metrics.get('test_accuracy', 0.0):.4f}, Latency: {winner_metrics.get('average_inference_latency_ms', 0.0)}ms)\n"
        f"{'='*60}"
    )

    # Source files
    src_model_file = models_dir / f"{winner_name}_best.keras"
    src_meta_file = models_dir / f"{winner_name}_best.json"

    # Destination files
    dest_model_file = models_dir / "best_model.keras"
    dest_meta_file = models_dir / "best_model_metadata.json"

    if src_model_file.exists():
        shutil.copy2(src_model_file, dest_model_file)
        logger.info(f"Copied {src_model_file.name} -> {dest_model_file.name}")

    # Create best model metadata
    best_metadata: Dict[str, Any] = {
        "selected_architecture": winner_name,
        "selection_strategy": "Highest validation/test macro-F1 score with latency tie-breaker",
        "selected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_checkpoint": str(src_model_file.name),
        "winner_metrics": winner_metrics,
        "all_candidates": {
            name: {
                "macro_f1": m.get("macro_f1"),
                "test_accuracy": m.get("test_accuracy"),
                "latency_ms": m.get("average_inference_latency_ms"),
                "model_size_mb": m.get("model_file_size_mb"),
            }
            for name, m in model_evaluations.items()
        },
        "food_safety_disclaimer": FOOD_SAFETY_DISCLAIMER,
    }

    if src_meta_file.exists():
        try:
            with open(src_meta_file, "r", encoding="utf-8") as f:
                orig_meta = json.load(f)
                best_metadata["hyperparameters"] = orig_meta.get("hyperparameters", {})
                best_metadata["class_to_idx"] = orig_meta.get("class_to_idx", CLASS_TO_INDEX)
                best_metadata["idx_to_class"] = orig_meta.get("idx_to_class", INDEX_TO_CLASS)
                best_metadata["input_shape"] = orig_meta.get("input_shape", list(IMAGE_SIZE) + [3])
        except Exception as e:
            logger.warning(f"Could not merge original metadata: {e}")

    with open(dest_meta_file, "w", encoding="utf-8") as f:
        json.dump(best_metadata, f, indent=2)
    logger.info(f"Saved best model deployment metadata to: {dest_meta_file}")

    # Write comparative summary
    comparison_path = reports_dir / "comparison.json"
    with open(comparison_path, "w", encoding="utf-8") as f:
        json.dump({
            "selected_model": winner_name,
            "models": model_evaluations,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }, f, indent=2)
    logger.info(f"Saved comparative summary to: {comparison_path}")

    return winner_name


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate trained Food Quality Classification models.")
    parser.add_argument(
        "--model",
        type=str,
        default="both",
        choices=["cnn", "efficientnet", "both", "best"],
        help="Model architecture to evaluate",
    )
    parser.add_argument(
        "--processed-dir",
        type=str,
        default=str(PROCESSED_DATA_DIR),
        help="Path to processed dataset directory",
    )
    parser.add_argument(
        "--models-dir",
        type=str,
        default=str(MODELS_DIR),
        help="Path to saved models directory",
    )
    parser.add_argument(
        "--reports-dir",
        type=str,
        default=str(REPORTS_DIR),
        help="Path to reports directory",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Inference batch size",
    )

    args = parser.parse_args()
    models_dir = Path(args.models_dir)
    reports_dir = Path(args.reports_dir)
    processed_dir = Path(args.processed_dir)
    test_dir = processed_dir / "test"

    # 1. Guard check for test dataset
    if not test_dir.exists():
        print(f"\n[ERROR] Test dataset split not found at: {test_dir}")
        print("Please prepare the dataset using: python ml/src/prepare_dataset.py")
        return 1

    # Load test split
    try:
        test_ds = load_dataset_split(
            directory=test_dir,
            image_size=IMAGE_SIZE,
            batch_size=args.batch_size,
            shuffle=False,
        )
    except Exception as e:
        print(f"\n[ERROR] Failed to load test dataset: {e}")
        return 1

    targets: List[str] = []
    if args.model in ("cnn", "both"):
        targets.append("cnn")
    if args.model in ("efficientnet", "both"):
        targets.append("efficientnet")
    if args.model == "best":
        targets.append("best")

    evaluations: Dict[str, Dict[str, Any]] = {}
    missing_models: List[str] = []

    for arch in targets:
        model_path, meta_path = resolve_model_path(arch, models_dir)
        if not model_path.exists():
            missing_models.append(f"{arch} ({model_path.name})")
            continue

        arch_out_dir = reports_dir / arch
        eval_metrics = evaluate_single_model(
            model_path=model_path,
            metadata_path=meta_path,
            test_ds=test_ds,
            output_dir=arch_out_dir,
        )
        evaluations[arch] = eval_metrics

    if missing_models:
        print(f"\n[NOTICE] The following model checkpoint(s) were not found in {models_dir}:")
        for m in missing_models:
            print(f" - {m}")
        print("Train models first using: python ml/src/train.py --model <cnn|efficientnet|both>")

    if evaluations and args.model == "both":
        select_best_model(evaluations, models_dir=models_dir, reports_dir=reports_dir)

    return 0 if evaluations else 1


if __name__ == "__main__":
    sys.exit(main())
