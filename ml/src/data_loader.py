"""Dataset Loader and Pipeline for Food Quality Classification.

Loads images from processed train/val/test splits, enforces canonical class mappings,
validates split integrity, applies augmentation strictly to training data, and optimizes
streaming with tf.data.
"""

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import tensorflow as tf

# Import dataset configuration
try:
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
        SUPPORTED_EXTENSIONS,
        TEST_DIR,
        TRAIN_DIR,
        VAL_DIR,
    )
except ImportError:
    from dataset_config import (
        CANONICAL_CLASSES,
        IMAGE_SIZE,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
        SUPPORTED_EXTENSIONS,
        TEST_DIR,
        TRAIN_DIR,
        VAL_DIR,
    )

logger = logging.getLogger("data_loader")

# Canonical class index mapping: deterministic across all splits
CLASS_TO_INDEX: Dict[str, int] = {cls_name: idx for idx, cls_name in enumerate(CANONICAL_CLASSES)}
INDEX_TO_CLASS: Dict[int, str] = {idx: cls_name for cls_name, idx in CLASS_TO_INDEX.items()}


class DatasetMissingError(FileNotFoundError):
    """Raised when the expected processed dataset or class directories are missing."""
    pass


def inspect_split_counts(split_dir: Path) -> Dict[str, int]:
    """Count valid images in each class folder of a split directory."""
    counts: Dict[str, int] = {}
    for cls in CANONICAL_CLASSES:
        cls_dir = split_dir / cls
        if not cls_dir.exists() or not cls_dir.is_dir():
            counts[cls] = 0
            continue
        valid_files = [
            f for f in cls_dir.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
        ]
        counts[cls] = len(valid_files)
    return counts


def verify_processed_dataset(
    processed_dir: Path = PROCESSED_DATA_DIR,
    min_samples_per_class: int = 1,
) -> Dict[str, Dict[str, int]]:
    """Verify that processed dataset exists and contains required classes in all splits.
    
    Raises:
        DatasetMissingError: If directories are missing or any class has fewer than min samples.
    """
    if not processed_dir.exists():
        raise DatasetMissingError(
            f"Processed data directory not found at: {processed_dir}. "
            "Please run 'python ml/src/prepare_dataset.py' after placing images in 'ml/data/raw/'."
        )

    split_dirs = {
        "train": processed_dir / "train",
        "val": processed_dir / "val",
        "test": processed_dir / "test",
    }

    full_counts: Dict[str, Dict[str, int]] = {}
    missing_errors: List[str] = []

    for split_name, s_dir in split_dirs.items():
        if not s_dir.exists():
            missing_errors.append(f"Split directory missing: '{s_dir}'")
            continue
        
        counts = inspect_split_counts(s_dir)
        full_counts[split_name] = counts

        for cls, count in counts.items():
            if count < min_samples_per_class:
                missing_errors.append(
                    f"Split '{split_name}' class '{cls}' has only {count} images "
                    f"(minimum required: {min_samples_per_class})."
                )

    if missing_errors:
        err_msg = "\n".join(f" - {err}" for err in missing_errors)
        raise DatasetMissingError(
            f"Dataset verification failed for '{processed_dir}':\n{err_msg}\n"
            "Action required: populate raw data and run 'python ml/src/prepare_dataset.py'."
        )

    return full_counts


def create_training_augmentation_layer() -> tf.keras.Sequential:
    """Create data augmentation pipeline applied exclusively during training.
    
    Includes random flip, slight rotation, small zoom, and subtle contrast changes.
    """
    return tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal", seed=RANDOM_SEED),
            tf.keras.layers.RandomRotation(0.08, fill_mode="nearest", seed=RANDOM_SEED),
            tf.keras.layers.RandomZoom(height_factor=(-0.08, 0.08), fill_mode="nearest", seed=RANDOM_SEED),
            tf.keras.layers.RandomContrast(0.1, seed=RANDOM_SEED),
        ],
        name="training_augmentation",
    )


def load_dataset_split(
    directory: Path,
    image_size: Tuple[int, int] = IMAGE_SIZE,
    batch_size: int = 32,
    shuffle: bool = False,
    seed: int = RANDOM_SEED,
) -> tf.data.Dataset:
    """Load a directory split into a tf.data.Dataset using canonical class mappings.
    
    Labels are encoded as integers matching CLASS_TO_INDEX.
    """
    if not directory.exists():
        raise DatasetMissingError(f"Directory not found: {directory}")

    # Explicitly list class names in canonical order to guarantee identical mapping
    dataset = tf.keras.utils.image_dataset_from_directory(
        directory=str(directory),
        labels="inferred",
        label_mode="int",
        class_names=CANONICAL_CLASSES,
        color_mode="rgb",
        batch_size=batch_size,
        image_size=image_size,
        shuffle=shuffle,
        seed=seed if shuffle else None,
        interpolation="bilinear",
    )
    return dataset


def get_data_loaders(
    processed_dir: Path = PROCESSED_DATA_DIR,
    batch_size: int = 32,
    image_size: Tuple[int, int] = IMAGE_SIZE,
    augment_training: bool = True,
    seed: int = RANDOM_SEED,
) -> Tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, Dict[str, Dict[str, int]]]:
    """Create optimized data pipelines for train, val, and test splits.
    
    Returns:
        (train_ds, val_ds, test_ds, split_counts)
    
    Note:
        - Validation and test splits are NEVER augmented and NEVER shuffled.
        - Training split applies augmentation if augment_training is True.
        - Uses prefetching to overlap data generation and model execution.
    """
    # 1. Verify dataset integrity first
    split_counts = verify_processed_dataset(processed_dir=processed_dir)

    train_path = processed_dir / "train"
    val_path = processed_dir / "val"
    test_path = processed_dir / "test"

    logger.info(f"Loading datasets from: {processed_dir}")
    logger.info(f"Split counts: {split_counts}")

    # 2. Load splits
    train_ds = load_dataset_split(
        train_path,
        image_size=image_size,
        batch_size=batch_size,
        shuffle=True,
        seed=seed,
    )

    val_ds = load_dataset_split(
        val_path,
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False,
    )

    test_ds = load_dataset_split(
        test_path,
        image_size=image_size,
        batch_size=batch_size,
        shuffle=False,
    )

    # 3. Apply augmentation strictly to training data
    if augment_training:
        aug_layer = create_training_augmentation_layer()
        train_ds = train_ds.map(
            lambda x, y: (aug_layer(x, training=True), y),
            num_parallel_calls=tf.data.AUTOTUNE,
        )

    # 4. Prefetch for pipeline efficiency
    train_ds = train_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(buffer_size=tf.data.AUTOTUNE)

    return train_ds, val_ds, test_ds, split_counts
