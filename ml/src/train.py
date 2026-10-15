"""Model Training Pipeline for Food Quality Classification.

Trains baseline Custom CNN and EfficientNetB0 transfer learning models
using callbacks (EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, CSVLogger),
saves models and metadata, and handles missing dataset conditions safely.
"""

import argparse
import logging
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import tensorflow as tf

# Import local ML modules
try:
    from ml.src.cnn_model import build_cnn_model
    from ml.src.data_loader import (
        CLASS_TO_INDEX,
        DatasetMissingError,
        get_data_loaders,
        verify_processed_dataset,
    )
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
    )
    from ml.src.efficientnet_model import (
        build_efficientnet_model,
        unfreeze_for_fine_tuning,
    )
    from ml.src.model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        REPORTS_DIR,
        get_device_info,
        save_model_metadata,
        set_random_seeds,
    )
except ImportError:
    from cnn_model import build_cnn_model
    from data_loader import (
        CLASS_TO_INDEX,
        DatasetMissingError,
        get_data_loaders,
        verify_processed_dataset,
    )
    from dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
    )
    from efficientnet_model import (
        build_efficientnet_model,
        unfreeze_for_fine_tuning,
    )
    from model_utils import (
        FOOD_SAFETY_DISCLAIMER,
        MODELS_DIR,
        REPORTS_DIR,
        get_device_info,
        save_model_metadata,
        set_random_seeds,
    )

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("train")


def train_single_architecture(
    architecture_name: str,
    train_ds: tf.data.Dataset,
    val_ds: tf.data.Dataset,
    split_counts: Dict[str, Dict[str, int]],
    epochs: int,
    batch_size: int,
    learning_rate: float,
    patience: int,
    models_dir: Path,
    reports_dir: Path,
    seed: int = RANDOM_SEED,
    fine_tune: bool = False,
    fine_tune_epochs: int = 10,
    fine_tune_lr: float = 1e-5,
    use_pretrained: bool = True,
) -> Tuple[tf.keras.Model, Dict[str, Any], Path]:
    """Train a single model architecture and record checkpoints and metadata."""
    set_random_seeds(seed)
    models_dir.mkdir(parents=True, exist_ok=True)
    arch_reports_dir = reports_dir / architecture_name
    arch_reports_dir.mkdir(parents=True, exist_ok=True)

    model_save_path = models_dir / f"{architecture_name}_best.keras"
    history_csv_path = arch_reports_dir / "training_history.csv"

    logger.info(f"========== Training Architecture: {architecture_name} ==========")
    logger.info(f"Target checkpoint: {model_save_path}")
    logger.info(f"Device: {get_device_info()['device_type']}")

    start_time = time.time()
    pretrained_loaded = False

    # 1. Instantiate model
    if architecture_name == "cnn":
        model = build_cnn_model(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            num_classes=len(CANONICAL_CLASSES),
            learning_rate=learning_rate,
            dropout_rate=0.3,
            model_name="custom_cnn",
        )
    elif architecture_name == "efficientnet":
        model, pretrained_loaded = build_efficientnet_model(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            num_classes=len(CANONICAL_CLASSES),
            learning_rate=learning_rate,
            dropout_rate=0.3,
            use_pretrained_weights=use_pretrained,
            model_name="efficientnet_b0",
        )
    else:
        raise ValueError(f"Unknown architecture: {architecture_name}")

    # 2. Setup standard callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=patience,
            restore_best_weights=True,
            verbose=1,
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(model_save_path),
            monitor="val_loss",
            save_best_only=True,
            verbose=1,
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=2,
            min_lr=1e-6,
            verbose=1,
        ),
        tf.keras.callbacks.CSVLogger(
            filename=str(history_csv_path),
            append=False,
        ),
    ]

    # 3. Train primary stage
    logger.info(f"Starting stage 1 training ({epochs} epochs maximum)...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1,
    )

    # 4. Optional Fine-tuning stage for EfficientNet
    if architecture_name == "efficientnet" and fine_tune:
        logger.info(f"Initiating stage 2 fine-tuning for {fine_tune_epochs} epochs...")
        model = unfreeze_for_fine_tuning(
            model=model,
            num_layers_to_unfreeze=20,
            fine_tune_lr=fine_tune_lr,
        )

        ft_callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor="val_loss",
                patience=max(2, patience // 2),
                restore_best_weights=True,
                verbose=1,
            ),
            tf.keras.callbacks.ModelCheckpoint(
                filepath=str(model_save_path),
                monitor="val_loss",
                save_best_only=True,
                verbose=1,
            ),
            tf.keras.callbacks.CSVLogger(
                filename=str(history_csv_path),
                append=True,
            ),
        ]

        model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=fine_tune_epochs,
            callbacks=ft_callbacks,
            verbose=1,
        )

    duration_seconds = round(time.time() - start_time, 2)
    logger.info(f"Completed training for {architecture_name} in {duration_seconds}s")

    # 5. Evaluate on validation set
    val_eval = model.evaluate(val_ds, return_dict=True, verbose=0)
    val_loss = float(val_eval.get("loss", 0.0))
    val_acc = float(val_eval.get("accuracy", 0.0))

    # 6. Save metadata
    hyperparameters = {
        "architecture": architecture_name,
        "epochs": epochs,
        "batch_size": batch_size,
        "initial_learning_rate": learning_rate,
        "early_stopping_patience": patience,
        "fine_tune_enabled": fine_tune,
        "fine_tune_epochs": fine_tune_epochs if fine_tune else 0,
        "fine_tune_learning_rate": fine_tune_lr if fine_tune else 0.0,
        "use_pretrained_weights": pretrained_loaded,
        "random_seed": seed,
    }

    metrics = {
        "val_loss": val_loss,
        "val_accuracy": val_acc,
        "training_duration_seconds": duration_seconds,
    }

    meta_path = save_model_metadata(
        model_path=model_save_path,
        architecture_name=architecture_name,
        class_to_idx=CLASS_TO_INDEX,
        hyperparameters=hyperparameters,
        metrics=metrics,
        dataset_info={"split_counts": split_counts},
    )

    return model, metrics, meta_path


def run_training_pipeline(
    model_choice: str = "both",
    epochs: int = 20,
    batch_size: int = 32,
    learning_rate: float = 1e-3,
    patience: int = 5,
    seed: int = RANDOM_SEED,
    processed_dir: Path = PROCESSED_DATA_DIR,
    models_dir: Path = MODELS_DIR,
    reports_dir: Path = REPORTS_DIR,
    fine_tune: bool = False,
    fine_tune_epochs: int = 10,
    fine_tune_lr: float = 1e-5,
    use_pretrained: bool = True,
) -> Dict[str, Any]:
    """Execute complete training workflow for selected models."""
    set_random_seeds(seed)

    # 1. Dataset availability guard: Fail fast if processed dataset is missing
    try:
        split_counts = verify_processed_dataset(processed_dir=processed_dir)
    except DatasetMissingError as e:
        logger.error(
            "\n" + "=" * 70 + "\n"
            "[TRAINING ABORTED: DATASET UNAVAILABLE]\n"
            f"{e}\n"
            "=" * 70
        )
        raise

    # 2. Create data loaders
    train_ds, val_ds, test_ds, _ = get_data_loaders(
        processed_dir=processed_dir,
        batch_size=batch_size,
        image_size=IMAGE_SIZE,
        augment_training=True,
        seed=seed,
    )

    architectures_to_train: List[str] = []
    if model_choice.lower() in ("cnn", "both"):
        architectures_to_train.append("cnn")
    if model_choice.lower() in ("efficientnet", "both"):
        architectures_to_train.append("efficientnet")

    results: Dict[str, Any] = {}

    for arch in architectures_to_train:
        _, metrics, meta_path = train_single_architecture(
            architecture_name=arch,
            train_ds=train_ds,
            val_ds=val_ds,
            split_counts=split_counts,
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate,
            patience=patience,
            models_dir=models_dir,
            reports_dir=reports_dir,
            seed=seed,
            fine_tune=fine_tune,
            fine_tune_epochs=fine_tune_epochs,
            fine_tune_lr=fine_tune_lr,
            use_pretrained=use_pretrained,
        )
        results[arch] = metrics

    logger.info("Training pipeline finished successfully.")
    logger.info(f"Results summary: {results}")
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Train Food Quality Classification models.")
    parser.add_argument(
        "--model",
        type=str,
        default="both",
        choices=["cnn", "efficientnet", "both"],
        help="Model architecture to train (default: both)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=20,
        help="Maximum training epochs (default: 20)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=32,
        help="Batch size (default: 32; use 16 for limited memory)",
    )
    parser.add_argument(
        "--lr",
        "--learning-rate",
        type=float,
        default=1e-3,
        help="Initial Adam learning rate (default: 0.001)",
    )
    parser.add_argument(
        "--patience",
        type=int,
        default=5,
        help="Early stopping patience (default: 5)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=RANDOM_SEED,
        help="Random seed (default: 42)",
    )
    parser.add_argument(
        "--fine-tune",
        action="store_true",
        help="Enable stage 2 fine-tuning for EfficientNet",
    )
    parser.add_argument(
        "--fine-tune-epochs",
        type=int,
        default=10,
        help="Epochs for EfficientNet fine-tuning (default: 10)",
    )
    parser.add_argument(
        "--no-pretrained",
        action="store_true",
        help="Train EfficientNet from scratch without ImageNet pretrained weights",
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
        help="Output directory for saved models",
    )
    parser.add_argument(
        "--reports-dir",
        type=str,
        default=str(REPORTS_DIR),
        help="Output directory for training curves and reports",
    )

    args = parser.parse_args()

    try:
        run_training_pipeline(
            model_choice=args.model,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.lr,
            patience=args.patience,
            seed=args.seed,
            processed_dir=Path(args.processed_dir),
            models_dir=Path(args.models_dir),
            reports_dir=Path(args.reports_dir),
            fine_tune=args.fine_tune,
            fine_tune_epochs=args.fine_tune_epochs,
            use_pretrained=not args.no_pretrained,
        )
        return 0
    except DatasetMissingError:
        print("\n[ERROR] Processed dataset not found or incomplete.")
        print("Please prepare the dataset first using: python ml/src/prepare_dataset.py")
        return 1
    except Exception as e:
        print(f"\n[FATAL ERROR] Training failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
