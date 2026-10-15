"""Comprehensive Test Suite for Dataset Pipeline (Phase 2).

Validates:
1. Syntax and importability of modules.
2. Missing-dataset handling and reporting.
3. Edge-case handling (corrupt images, zero-byte files, unknown labels).
4. Deduplication via SHA-256 content hashing.
5. Deterministic stratified splitting (70% train, 15% val, 15% test) and output manifest.
"""

import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from PIL import Image

# Import pipeline components
from ml.src.dataset_config import (
    CANONICAL_CLASSES,
    IMAGE_SIZE,
    RANDOM_SEED,
    SPLIT_RATIOS,
    map_raw_folder_to_class,
)
from ml.src.validate_dataset import check_single_image, validate_dataset
from ml.src.prepare_dataset import prepare_dataset, compute_file_sha256


class TestDatasetPipeline(unittest.TestCase):
    def setUp(self):
        """Create a self-contained temporary workspace for tests."""
        self.temp_dir = Path(tempfile.mkdtemp(prefix="food_test_"))
        self.raw_dir = self.temp_dir / "raw"
        self.processed_dir = self.temp_dir / "processed"
        self.report_path = self.temp_dir / "validation_report.json"
        self.manifest_path = self.processed_dir / "manifest.csv"
        self.summary_path = self.processed_dir / "dataset_summary.json"

    def tearDown(self):
        """Clean up temporary workspace."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_sample_image(self, path: Path, color=(200, 50, 50), size=(100, 100)):
        """Helper to create a valid RGB PNG/JPEG image."""
        path.parent.mkdir(parents=True, exist_ok=True)
        img = Image.new("RGB", size, color=color)
        img.save(path)

    def test_01_missing_dataset_handling(self):
        """Test validator response when raw directory is missing or empty."""
        non_existent_dir = self.temp_dir / "does_not_exist"
        report = validate_dataset(raw_dir=non_existent_dir, report_path=self.report_path)
        self.assertEqual(report["status"], "FAILED")
        self.assertFalse(report["is_valid_for_split"])
        self.assertTrue(self.report_path.exists())

        # Test empty directory
        empty_dir = self.temp_dir / "empty_raw"
        empty_dir.mkdir(parents=True, exist_ok=True)
        report_empty = validate_dataset(raw_dir=empty_dir, report_path=self.report_path)
        self.assertEqual(report_empty["status"], "FAILED")
        self.assertEqual(report_empty["valid_images_count"], 0)

    def test_02_raw_folder_mapping(self):
        """Verify label mapping heuristics and unknown folder handling."""
        self.assertEqual(map_raw_folder_to_class("freshapples"), "Fresh")
        self.assertEqual(map_raw_folder_to_class("fresh_banana"), "Fresh")
        self.assertEqual(map_raw_folder_to_class("freshoranges"), "Fresh")
        self.assertEqual(map_raw_folder_to_class("rottenapples"), "Spoiled")
        self.assertEqual(map_raw_folder_to_class("rotten_banana"), "Spoiled")
        self.assertEqual(map_raw_folder_to_class("stale_bread"), "Spoiled")
        self.assertIsNone(map_raw_folder_to_class("random_unknown_folder"))
        self.assertIsNone(map_raw_folder_to_class("moderate_unverified"))

    def test_03_corrupt_and_invalid_images_detection(self):
        """Test detection of zero-byte files and corrupt image byte streams."""
        corrupt_dir = self.raw_dir / "freshapples"
        corrupt_dir.mkdir(parents=True, exist_ok=True)

        # 1. Zero-byte file
        zero_file = corrupt_dir / "zero.jpg"
        zero_file.write_bytes(b"")

        # 2. Corrupt file with invalid header
        garbage_file = corrupt_dir / "garbage.jpg"
        garbage_file.write_bytes(b"THIS_IS_NOT_AN_IMAGE_HEADER_1234567890")

        # 3. Valid image
        valid_file = corrupt_dir / "valid.jpg"
        self._create_sample_image(valid_file, color=(0, 200, 0))

        is_valid_zero, err_zero, _, _ = check_single_image(zero_file)
        self.assertFalse(is_valid_zero)
        self.assertIn("empty", err_zero.lower())

        is_valid_garb, err_garb, _, _ = check_single_image(garbage_file)
        self.assertFalse(is_valid_garb)
        self.assertIn("corrupted", err_garb.lower())

        is_valid_ok, err_ok, size, _ = check_single_image(valid_file)
        self.assertTrue(is_valid_ok)
        self.assertIsNone(err_ok)
        self.assertEqual(size, (100, 100))

    def test_04_synthetic_dataset_preparation_and_splits(self):
        """Verify complete validation, deduplication, stratified splitting, and manifest generation."""
        # Generate 20 distinct images for Fresh, 20 distinct for Spoiled
        fresh_dir = self.raw_dir / "freshapples"
        rotten_dir = self.raw_dir / "rottenoranges"
        unknown_dir = self.raw_dir / "unlabeled_produce"

        for i in range(20):
            # Vary colors so SHA-256 hashes are unique
            self._create_sample_image(fresh_dir / f"fresh_{i}.png", color=(10 + i * 5, 200, 10))
            self._create_sample_image(rotten_dir / f"rotten_{i}.png", color=(150, 50, 10 + i * 5))

        # Add 1 duplicate image in fresh
        shutil.copy2(fresh_dir / "fresh_0.png", fresh_dir / "fresh_0_duplicate.png")

        # Add 1 corrupt image in fresh
        (fresh_dir / "broken.jpg").write_bytes(b"CORRUPTED_STREAM")

        # Add 1 image in unknown folder
        self._create_sample_image(unknown_dir / "misc.png", color=(50, 50, 50))

        # Step A: Validate
        val_report = validate_dataset(raw_dir=self.raw_dir, report_path=self.report_path)
        self.assertEqual(val_report["status"], "PASSED")
        self.assertTrue(val_report["is_valid_for_split"])
        self.assertEqual(val_report["corrupted_images_count"], 1)
        self.assertEqual(val_report["unknown_label_files_count"], 1)
        self.assertIn("unlabeled_produce", val_report["unknown_folders"])
        self.assertEqual(val_report["class_counts"]["Fresh"], 21)  # 20 + 1 duplicate
        self.assertEqual(val_report["class_counts"]["Spoiled"], 20)

        # Step B: Prepare dataset
        summary = prepare_dataset(
            raw_dir=self.raw_dir,
            processed_dir=self.processed_dir,
            manifest_path=self.manifest_path,
            summary_path=self.summary_path,
            validation_report_path=self.report_path,
            seed=RANDOM_SEED,
            skip_validation=False,
        )

        # Assert duplicate was caught
        self.assertEqual(summary["duplicates_skipped"], 1)
        # Total unique processed: 20 Fresh + 20 Spoiled = 40
        self.assertEqual(summary["unique_images_processed"], 40)

        # Check split numbers (70% = 14, 15% = 3, 15% = 3 per class)
        self.assertEqual(summary["splits"]["train"]["Fresh"], 14)
        self.assertEqual(summary["splits"]["val"]["Fresh"], 3)
        self.assertEqual(summary["splits"]["test"]["Fresh"], 3)
        self.assertEqual(summary["splits"]["train"]["Spoiled"], 14)
        self.assertEqual(summary["splits"]["val"]["Spoiled"], 3)
        self.assertEqual(summary["splits"]["test"]["Spoiled"], 3)

        # Verify files exist in processed directories
        for split in ["train", "val", "test"]:
            for cls in CANONICAL_CLASSES:
                target_dir = self.processed_dir / split / cls
                files = list(target_dir.glob("*.*"))
                expected_count = summary["splits"][split][cls]
                self.assertEqual(len(files), expected_count, f"Mismatch in {target_dir}")

        # Verify manifest.csv
        self.assertTrue(self.manifest_path.exists())
        with open(self.manifest_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
            # 1 header + 40 records = 41 lines
            self.assertEqual(len(lines), 41)


if __name__ == "__main__":
    unittest.main()
