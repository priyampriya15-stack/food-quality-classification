"""Dataset Preparation Script for Food Quality Classification.

Validates raw images, detects duplicates, performs deterministic stratified
splitting (70% Train, 15% Val, 15% Test), copies files into split directories,
and produces manifest.csv and dataset_summary.json.
"""

import argparse
import csv
import datetime
import hashlib
import json
import logging
import random
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from PIL import Image

# Import configuration and validator
try:
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        DATASET_SUMMARY_PATH,
        MANIFEST_PATH,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
        RAW_DATA_DIR,
        SPLIT_RATIOS,
        SUPPORTED_EXTENSIONS,
        VALIDATION_REPORT_PATH,
        get_target_split_dirs,
        map_raw_folder_to_class,
    )
    from ml.src.validate_dataset import check_single_image, resolve_image_label, validate_dataset
except ImportError:
    from dataset_config import (
        CANONICAL_CLASSES,
        DATASET_SUMMARY_PATH,
        MANIFEST_PATH,
        PROCESSED_DATA_DIR,
        RANDOM_SEED,
        RAW_DATA_DIR,
        SPLIT_RATIOS,
        SUPPORTED_EXTENSIONS,
        VALIDATION_REPORT_PATH,
        get_target_split_dirs,
        map_raw_folder_to_class,
    )
    from validate_dataset import check_single_image, resolve_image_label, validate_dataset

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("prepare_dataset")


def compute_file_sha256(file_path: Path, chunk_size: int = 65536) -> str:
    """Compute SHA-256 checksum of an image file to identify exact duplicates."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            sha256.update(chunk)
    return sha256.hexdigest()


def clean_processed_split_dirs(target_dirs: Dict[str, Dict[str, Path]]) -> None:
    """Safely clean only the class subdirectories in processed splits.
    
    Preserves all other files and directories.
    """
    for split, class_map in target_dirs.items():
        for cls_name, dir_path in class_map.items():
            if dir_path.exists():
                logger.info(f"Clearing existing directory: {dir_path}")
                shutil.rmtree(dir_path)
            dir_path.mkdir(parents=True, exist_ok=True)


def collect_valid_samples(raw_dir: Path) -> Tuple[Dict[str, List[Dict[str, Any]]], int]:
    """Scan raw directory, filter valid images, detect duplicate hashes, and group by class.
    
    Returns:
        (class_samples_dict, duplicate_count)
    """
    all_files: List[Path] = [p for p in raw_dir.rglob("*") if p.is_file()]
    image_files: List[Path] = [
        p for p in all_files if p.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    seen_hashes: Set[str] = set()
    duplicate_count: int = 0
    grouped_samples: Dict[str, List[Dict[str, Any]]] = {cls: [] for cls in CANONICAL_CLASSES}

    for img_path in sorted(image_files):
        # Check image validity
        is_valid, err_msg, size, mode = check_single_image(img_path)
        if not is_valid:
            continue

        # Check label mapping
        canonical_class, folder_checked = resolve_image_label(img_path, raw_dir)
        if canonical_class not in CANONICAL_CLASSES:
            continue

        # Compute hash for duplicate prevention & anti-leakage
        img_hash = compute_file_sha256(img_path)
        if img_hash in seen_hashes:
            duplicate_count += 1
            logger.debug(f"Skipping duplicate image [{img_path.name}] with hash {img_hash[:10]}")
            continue

        seen_hashes.add(img_hash)
        grouped_samples[canonical_class].append({
            "original_path": img_path,
            "filename": img_path.name,
            "source_folder": folder_checked,
            "class_label": canonical_class,
            "image_hash": img_hash,
            "width": size[0] if size else None,
            "height": size[1] if size else None,
            "file_size": img_path.stat().st_size,
        })

    return grouped_samples, duplicate_count


def compute_stratified_splits(
    samples: List[Dict[str, Any]],
    seed: int = RANDOM_SEED,
) -> Dict[str, List[Dict[str, Any]]]:
    """Deterministically partition a list of samples into train (70%), val (15%), test (15%)."""
    # Deterministic shuffle
    rng = random.Random(seed)
    shuffled = list(samples)
    shuffled.sort(key=lambda s: s["image_hash"])  # Sort first for platform-independent stability
    rng.shuffle(shuffled)

    n = len(shuffled)
    n_train = int(round(n * SPLIT_RATIOS["train"]))
    n_val = int(round(n * SPLIT_RATIOS["val"]))
    # Remainder goes to test to guarantee sum equals total
    n_test = n - (n_train + n_val)

    # If small count, guarantee distribution if at least 3 items exist
    if n >= 3:
        if n_train == 0:
            n_train = 1
        if n_val == 0:
            n_val = 1
        if n_test <= 0:
            n_test = 1
            if n_train > 1:
                n_train -= 1

    train_slice = shuffled[:n_train]
    val_slice = shuffled[n_train : n_train + n_val]
    test_slice = shuffled[n_train + n_val :]

    return {
        "train": train_slice,
        "val": val_slice,
        "test": test_slice,
    }


def prepare_dataset(
    raw_dir: Path = RAW_DATA_DIR,
    processed_dir: Path = PROCESSED_DATA_DIR,
    manifest_path: Path = MANIFEST_PATH,
    summary_path: Path = DATASET_SUMMARY_PATH,
    validation_report_path: Optional[Path] = None,
    seed: int = RANDOM_SEED,
    skip_validation: bool = False,
) -> Dict[str, Any]:
    """Execute complete dataset preparation, splitting, and manifest generation."""
    logger.info("Initializing dataset preparation...")
    
    # 1. Validation check
    if not skip_validation:
        val_rep_path = validation_report_path if validation_report_path is not None else VALIDATION_REPORT_PATH
        val_report = validate_dataset(raw_dir=raw_dir, report_path=val_rep_path)
        if not val_report.get("is_valid_for_split", False):
            raise RuntimeError(
                f"Dataset validation failed: {val_report.get('summary_messages')}. "
                "Resolve data issues or populate raw images before preparing splits."
            )

    # 2. Collect and deduplicate valid samples
    grouped_samples, duplicate_count = collect_valid_samples(raw_dir)
    total_valid = sum(len(items) for items in grouped_samples.values())

    if total_valid == 0:
        raise RuntimeError(f"No valid images found in {raw_dir} matching canonical classes.")

    # 3. Setup processed target directories
    target_dirs = get_target_split_dirs(processed_dir)
    clean_processed_split_dirs(target_dirs)

    # 4. Perform stratified splitting & copy files
    manifest_rows: List[Dict[str, Any]] = []
    split_counts: Dict[str, Dict[str, int]] = {
        split: {cls: 0 for cls in CANONICAL_CLASSES} for split in SPLIT_RATIOS.keys()
    }

    for cls_name, cls_samples in grouped_samples.items():
        if len(cls_samples) == 0:
            logger.warning(f"Class '{cls_name}' has 0 samples.")
            continue

        splits = compute_stratified_splits(cls_samples, seed=seed)

        for split_name, items in splits.items():
            dest_dir = target_dirs[split_name][cls_name]
            
            for idx, item in enumerate(items, 1):
                src_path: Path = item["original_path"]
                ext = src_path.suffix.lower()
                
                # Collision-resistant descriptive filename:
                # {class}_{source_folder}_{index}_{hash8}.{ext}
                clean_src_folder = item["source_folder"].replace("-", "_").replace(" ", "_")
                dest_filename = f"{cls_name.lower()}_{clean_src_folder}_{idx:05d}_{item['image_hash'][:8]}{ext}"
                dest_path = dest_dir / dest_filename

                # Copy file preserving timestamp
                shutil.copy2(src_path, dest_path)

                split_counts[split_name][cls_name] += 1

                # Record manifest entry
                rel_dest = dest_path.relative_to(processed_dir.parent)
                manifest_rows.append({
                    "file_name": dest_filename,
                    "original_path": str(src_path.resolve()),
                    "processed_path": str(rel_dest).replace("\\", "/"),
                    "split": split_name,
                    "class_label": cls_name,
                    "image_hash": item["image_hash"],
                    "width": item["width"],
                    "height": item["height"],
                    "file_size_bytes": item["file_size"],
                })

    # 5. Write manifest.csv
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "file_name",
            "original_path",
            "processed_path",
            "split",
            "class_label",
            "image_hash",
            "width",
            "height",
            "file_size_bytes",
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest_rows)
    logger.info(f"Manifest written to: {manifest_path} ({len(manifest_rows)} entries)")

    # 6. Write dataset_summary.json
    summary: Dict[str, Any] = {
        "creation_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "random_seed": seed,
        "canonical_classes": CANONICAL_CLASSES,
        "split_ratios": SPLIT_RATIOS,
        "total_images_scanned": total_valid + duplicate_count,
        "unique_images_processed": total_valid,
        "duplicates_skipped": duplicate_count,
        "splits": split_counts,
        "total_per_split": {
            split: sum(split_counts[split].values()) for split in SPLIT_RATIOS.keys()
        },
        "total_per_class": {
            cls: sum(split_counts[split][cls] for split in SPLIT_RATIOS.keys())
            for cls in CANONICAL_CLASSES
        },
    }

    summary_path.parent.mkdir(parents=True, exist_ok=True)
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    logger.info(f"Dataset summary written to: {summary_path}")

    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare and split food quality image dataset.")
    parser.add_argument(
        "--raw-dir",
        type=str,
        default=str(RAW_DATA_DIR),
        help="Path to raw dataset directory",
    )
    parser.add_argument(
        "--processed-dir",
        type=str,
        default=str(PROCESSED_DATA_DIR),
        help="Path to output processed dataset directory",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=RANDOM_SEED,
        help="Random seed for deterministic splitting",
    )
    parser.add_argument(
        "--skip-validation",
        action="store_true",
        help="Skip strict pre-validation checks",
    )

    args = parser.parse_args()

    try:
        summary = prepare_dataset(
            raw_dir=Path(args.raw_dir),
            processed_dir=Path(args.processed_dir),
            seed=args.seed,
            skip_validation=args.skip_validation,
        )
        print("\n[SUCCESS] Dataset preparation and stratified splitting complete.")
        print(f"Total Unique Images Processed: {summary['unique_images_processed']}")
        print(f"Duplicates Skipped: {summary['duplicates_skipped']}")
        print(f"Splits: {json.dumps(summary['total_per_split'])}")
        return 0
    except Exception as e:
        print(f"\n[ERROR] Dataset preparation failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
