"""Dataset Configuration for Food Quality Classification.

Defines directory layouts, canonical class names, supported formats,
split ratios, image dimensions, and raw folder mapping rules.
"""

from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

# Base paths
SRC_DIR = Path(__file__).resolve().parent
ML_DIR = SRC_DIR.parent
PROJECT_ROOT = ML_DIR.parent

DATA_DIR = ML_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
REPORTS_DIR = ML_DIR / "reports"

# Sub-splits within processed directory
TRAIN_DIR = PROCESSED_DATA_DIR / "train"
VAL_DIR = PROCESSED_DATA_DIR / "val"
TEST_DIR = PROCESSED_DATA_DIR / "test"

# Output artifacts
VALIDATION_REPORT_PATH = DATA_DIR / "validation_report.json"
MANIFEST_PATH = PROCESSED_DATA_DIR / "manifest.csv"
DATASET_SUMMARY_PATH = PROCESSED_DATA_DIR / "dataset_summary.json"

# Canonical target classes
# Per project specification: Only create 'Fresh' and 'Spoiled' initially.
# Do NOT create 'Moderate Quality' unless verified labeled data exists.
CANONICAL_CLASSES: List[str] = ["Fresh", "Spoiled"]

# Supported image file extensions
SUPPORTED_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

# Target image resolution for model input (height, width)
IMAGE_SIZE: Tuple[int, int] = (224, 224)

# Deterministic random seed
RANDOM_SEED: int = 42

# Reproducible dataset split ratios (must sum to 1.0)
SPLIT_RATIOS: Dict[str, float] = {
    "train": 0.70,
    "val": 0.15,
    "test": 0.15,
}

# Verify split ratios
assert abs(sum(SPLIT_RATIOS.values()) - 1.0) < 1e-6, "Split ratios must sum to 1.0"

# Mapping rules from common raw folder names (e.g., Kaggle datasets) to canonical classes
RAW_FOLDER_MAPPING: Dict[str, str] = {
    # Direct class names
    "fresh": "Fresh",
    "spoiled": "Spoiled",
    "rotten": "Spoiled",
    "stale": "Spoiled",
    
    # Kaggle 'Fruits fresh and rotten for classification' standard folders
    "freshapples": "Fresh",
    "freshbanana": "Fresh",
    "freshoranges": "Fresh",
    "fresh_apples": "Fresh",
    "fresh_banana": "Fresh",
    "fresh_oranges": "Fresh",
    "fresh_fruits": "Fresh",
    "fresh_vegetables": "Fresh",
    "freshcucumber": "Fresh",
    "freshokra": "Fresh",
    "freshtomato": "Fresh",
    "fresh_tomato": "Fresh",
    "fresh_potato": "Fresh",
    "fresh_capsicum": "Fresh",
    
    "rottenapples": "Spoiled",
    "rottenbanana": "Spoiled",
    "rottenoranges": "Spoiled",
    "rotten_apples": "Spoiled",
    "rotten_banana": "Spoiled",
    "rotten_oranges": "Spoiled",
    "rotten_fruits": "Spoiled",
    "rotten_vegetables": "Spoiled",
    "rottencucumber": "Spoiled",
    "rottenokra": "Spoiled",
    "rottentomato": "Spoiled",
    "rotten_tomato": "Spoiled",
    "rotten_potato": "Spoiled",
    "rotten_capsicum": "Spoiled",
}


def map_raw_folder_to_class(folder_name: str) -> Optional[str]:
    """Map a raw directory or label string to a canonical target class.
    
    Returns:
        Canonical class name ('Fresh' or 'Spoiled') if recognized and verified,
        or None if unknown/unsupported.
    """
    cleaned = folder_name.strip().lower().replace("-", "_").replace(" ", "_")
    
    # 1. Exact match against mapping dictionary
    if cleaned in RAW_FOLDER_MAPPING:
        return RAW_FOLDER_MAPPING[cleaned]
    
    # 2. Strict prefix heuristics (only if unambiguously 'fresh' or 'rotten/spoiled/stale')
    if cleaned.startswith("fresh_") or cleaned.startswith("fresh"):
        return "Fresh"
    if cleaned.startswith("rotten_") or cleaned.startswith("rotten") or \
       cleaned.startswith("spoiled_") or cleaned.startswith("spoiled") or \
       cleaned.startswith("stale_") or cleaned.startswith("stale"):
        return "Spoiled"
        
    return None


def get_target_split_dirs(base_processed_dir: Optional[Path] = None) -> Dict[str, Dict[str, Path]]:
    """Return dictionary of target paths organized by split and canonical class."""
    root_dir = base_processed_dir if base_processed_dir is not None else PROCESSED_DATA_DIR
    dirs: Dict[str, Dict[str, Path]] = {}
    for split in SPLIT_RATIOS.keys():
        dirs[split] = {}
        for cls in CANONICAL_CLASSES:
            dirs[split][cls] = root_dir / split / cls
    return dirs

