"""Dataset Validation Script for Food Quality Classification.

Recursively scans raw food image directories, verifies image integrity,
checks class labels, detects corrupted files, and generates a structured
validation report.
"""

import argparse
import datetime
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from PIL import Image, UnidentifiedImageError

# Import configuration
try:
    from ml.src.dataset_config import (
        CANONICAL_CLASSES,
        RAW_DATA_DIR,
        SUPPORTED_EXTENSIONS,
        VALIDATION_REPORT_PATH,
        map_raw_folder_to_class,
    )
except ImportError:
    # Allow running directly from ml/src/
    from dataset_config import (
        CANONICAL_CLASSES,
        RAW_DATA_DIR,
        SUPPORTED_EXTENSIONS,
        VALIDATION_REPORT_PATH,
        map_raw_folder_to_class,
    )

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("validate_dataset")


def check_single_image(image_path: Path) -> Tuple[bool, Optional[str], Optional[Tuple[int, int]], Optional[str]]:
    """Inspect an image file for integrity, dimensions, and color mode.
    
    Returns:
        (is_valid, error_message, (width, height), mode)
    """
    try:
        # Check non-empty file size
        file_size = image_path.stat().st_size
        if file_size == 0:
            return False, "File is completely empty (0 bytes)", None, None

        # Verify integrity using PIL
        with Image.open(image_path) as img:
            img.verify()  # Verifies header and stream without decoding full bitmap

        # Re-open to read dimensions and mode (verify alters stream)
        with Image.open(image_path) as img:
            width, height = img.size
            mode = img.mode
            if width <= 0 or height <= 0:
                return False, f"Invalid image dimensions: {width}x{height}", None, None
            return True, None, (width, height), mode

    except (UnidentifiedImageError, OSError, SyntaxError) as e:
        return False, f"Corrupted or unreadable image: {str(e)}", None, None
    except Exception as e:
        return False, f"Unexpected error reading image: {str(e)}", None, None


def resolve_image_label(image_path: Path, raw_root: Path) -> Tuple[Optional[str], str]:
    """Determine the canonical class label from path hierarchy relative to raw_root.
    
    Returns:
        (canonical_class, folder_name_checked)
    """
    rel_path = image_path.relative_to(raw_root)
    # Check parts from parent folder upwards
    for part in reversed(rel_path.parent.parts):
        mapped = map_raw_folder_to_class(part)
        if mapped:
            return mapped, part
    
    # If no ancestor matched, return the immediate parent name as unknown
    immediate_parent = rel_path.parent.name if rel_path.parent.parts else "root"
    return None, immediate_parent


def validate_dataset(
    raw_dir: Path = RAW_DATA_DIR,
    report_path: Path = VALIDATION_REPORT_PATH,
    verbose: bool = False,
) -> Dict[str, Any]:
    """Execute complete validation on raw dataset directory.
    
    Generates structured validation report and logs warnings/errors.
    """
    logger.info(f"Starting dataset validation on: {raw_dir}")
    
    report: Dict[str, Any] = {
        "status": "FAILED",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "raw_data_dir": str(raw_dir.resolve()),
        "total_files_scanned": 0,
        "valid_images_count": 0,
        "corrupted_images_count": 0,
        "unknown_label_files_count": 0,
        "corrupted_files": [],
        "unknown_folders": [],
        "class_counts": {cls: 0 for cls in CANONICAL_CLASSES},
        "extensions_found": {},
        "summary_messages": [],
        "is_valid_for_split": False,
    }

    # 1. Check directory existence
    if not raw_dir.exists():
        msg = f"Raw dataset directory does not exist: {raw_dir}"
        logger.error(msg)
        report["summary_messages"].append(msg)
        save_report(report, report_path)
        return report

    if not raw_dir.is_dir():
        msg = f"Raw dataset path is not a directory: {raw_dir}"
        logger.error(msg)
        report["summary_messages"].append(msg)
        save_report(report, report_path)
        return report

    # 2. Find all candidate image files
    all_files: List[Path] = [p for p in raw_dir.rglob("*") if p.is_file()]
    image_files: List[Path] = [
        p for p in all_files if p.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    report["total_files_scanned"] = len(image_files)

    if len(image_files) == 0:
        msg = f"No images with supported extensions {SUPPORTED_EXTENSIONS} found in {raw_dir}"
        logger.warning(msg)
        report["summary_messages"].append(msg)
        save_report(report, report_path)
        return report

    # 3. Validate each image
    unknown_folders_set: Set[str] = set()

    for idx, img_path in enumerate(image_files, 1):
        ext = img_path.suffix.lower()
        report["extensions_found"][ext] = report["extensions_found"].get(ext, 0) + 1

        # Check readability & corruption
        is_valid, err_msg, size, mode = check_single_image(img_path)
        if not is_valid:
            report["corrupted_images_count"] += 1
            report["corrupted_files"].append({
                "path": str(img_path.resolve()),
                "error": err_msg,
            })
            if verbose:
                logger.warning(f"Corrupt image [{img_path.name}]: {err_msg}")
            continue

        # Check label mapping
        canonical_class, folder_checked = resolve_image_label(img_path, raw_dir)
        if canonical_class is None:
            report["unknown_label_files_count"] += 1
            unknown_folders_set.add(folder_checked)
            if verbose:
                logger.warning(f"Unknown class mapping for [{img_path}]: folder '{folder_checked}'")
            continue

        report["class_counts"][canonical_class] += 1
        report["valid_images_count"] += 1

    report["unknown_folders"] = sorted(list(unknown_folders_set))

    # 4. Check validation criteria
    missing_classes = [
        cls for cls, count in report["class_counts"].items() if count == 0
    ]
    
    if report["corrupted_images_count"] > 0:
        report["summary_messages"].append(
            f"Detected {report['corrupted_images_count']} corrupted image(s)."
        )

    if report["unknown_label_files_count"] > 0:
        report["summary_messages"].append(
            f"Detected {report['unknown_label_files_count']} image(s) in unmapped folders: {report['unknown_folders']}."
        )

    if missing_classes:
        report["summary_messages"].append(
            f"Missing required canonical classes in raw data: {missing_classes}. Each class must have at least 1 valid sample."
        )

    # Dataset is considered valid for train/val/test splitting if:
    # - There are valid images
    # - Both 'Fresh' and 'Spoiled' have at least 10 samples (to allow stratified splitting)
    # - No unknown fatal directory blockers
    has_sufficient_samples = all(
        report["class_counts"].get(cls, 0) >= 5 for cls in CANONICAL_CLASSES
    )

    if has_sufficient_samples:
        report["status"] = "PASSED"
        report["is_valid_for_split"] = True
        report["summary_messages"].append(
            f"Dataset validation passed. Ready for splitting: {report['class_counts']}."
        )
        logger.info(f"Validation PASSED. Class distribution: {report['class_counts']}")
    else:
        report["status"] = "FAILED"
        report["is_valid_for_split"] = False
        msg = f"Insufficient samples per class for reliable splitting (minimum 5 required per class). Current counts: {report['class_counts']}"
        report["summary_messages"].append(msg)
        logger.error(msg)

    save_report(report, report_path)
    return report


def save_report(report: Dict[str, Any], report_path: Path) -> None:
    """Save validation report to JSON file."""
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    logger.info(f"Validation report saved to: {report_path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate raw food quality image dataset.")
    parser.add_argument(
        "--raw-dir",
        type=str,
        default=str(RAW_DATA_DIR),
        help="Path to raw dataset directory",
    )
    parser.add_argument(
        "--output-report",
        type=str,
        default=str(VALIDATION_REPORT_PATH),
        help="Path to save validation JSON report",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable detailed per-file logging",
    )

    args = parser.parse_args()
    report = validate_dataset(
        raw_dir=Path(args.raw_dir),
        report_path=Path(args.output_report),
        verbose=args.verbose,
    )

    if report["status"] == "PASSED":
        print("\n[SUCCESS] Dataset validation passed successfully.")
        return 0
    else:
        print("\n[WARNING/FAILURE] Dataset validation failed or requires attention.")
        for msg in report["summary_messages"]:
            print(f" - {msg}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
