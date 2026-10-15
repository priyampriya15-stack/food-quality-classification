"""Comprehensive Unit and Integration Test Suite for Phase 3 Model Pipeline.

Tests:
1. Class mapping consistency.
2. Missing dataset handling.
3. Invalid and corrupt image handling.
4. Input tensor shape handling in CNN.
5. Model output shape in EfficientNet.
6. Probability output dimensions and softmax properties.
7. Prediction metadata consistency and disclaimer.
8. Missing model handling in inference module and backend service.
9. Metric calculation using a small known synthetic example.
10. Model serialization and loading using a test model.
"""

import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.metrics import classification_report, confusion_matrix
import tensorflow as tf

# Import Phase 3 modules
from ml.src.cnn_model import build_cnn_model
from ml.src.data_loader import (
    CLASS_TO_INDEX,
    INDEX_TO_CLASS,
    DatasetMissingError,
    verify_processed_dataset,
)
from ml.src.dataset_config import CANONICAL_CLASSES, IMAGE_SIZE
from ml.src.efficientnet_model import build_efficientnet_model
from ml.src.model_utils import (
    FOOD_SAFETY_DISCLAIMER,
    load_model_metadata,
    resolve_model_path,
    save_model_metadata,
)
from ml.src.predict import load_inference_model, predict_image, preprocess_image_file
from backend.app.services.prediction_service import PredictionService


class TestModelPipeline(unittest.TestCase):
    def setUp(self):
        """Create isolated temporary test workspace."""
        self.temp_dir = Path(tempfile.mkdtemp(prefix="food_model_test_"))
        self.models_dir = self.temp_dir / "models"
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def tearDown(self):
        """Remove temporary directory."""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir, ignore_errors=True)

    def _create_dummy_image(self, path: Path, color=(100, 150, 200), size=(100, 100)):
        path.parent.mkdir(parents=True, exist_ok=True)
        img = Image.new("RGB", size, color=color)
        img.save(path)

    def test_01_class_mapping_consistency(self):
        """1. Verify canonical classes and bidirectional index mapping."""
        self.assertEqual(CANONICAL_CLASSES, ["Fresh", "Spoiled"])
        self.assertEqual(CLASS_TO_INDEX["Fresh"], 0)
        self.assertEqual(CLASS_TO_INDEX["Spoiled"], 1)
        self.assertEqual(INDEX_TO_CLASS[0], "Fresh")
        self.assertEqual(INDEX_TO_CLASS[1], "Spoiled")

    def test_02_missing_dataset_handling(self):
        """2. Verify verify_processed_dataset raises DatasetMissingError on empty/absent data."""
        empty_dir = self.temp_dir / "empty_processed"
        with self.assertRaises(DatasetMissingError):
            verify_processed_dataset(empty_dir)

    def test_03_invalid_image_handling(self):
        """3. Verify preprocess_image_file catches 0-byte, corrupt, or unsupported images."""
        # Non-existent
        with self.assertRaises(FileNotFoundError):
            preprocess_image_file(self.temp_dir / "ghost.jpg")

        # 0-byte file
        zero_file = self.temp_dir / "zero.jpg"
        zero_file.write_bytes(b"")
        with self.assertRaises(ValueError) as ctx:
            preprocess_image_file(zero_file)
        self.assertIn("empty", str(ctx.exception).lower())

        # Corrupted file
        corrupt_file = self.temp_dir / "corrupt.jpg"
        corrupt_file.write_bytes(b"NOT_AN_IMAGE_STREAM")
        with self.assertRaises(ValueError) as ctx:
            preprocess_image_file(corrupt_file)
        self.assertIn("corrupt", str(ctx.exception).lower())

    def test_04_cnn_input_and_output_shapes(self):
        """4. Verify CNN input tensor acceptance and output shape (1, 2)."""
        model = build_cnn_model(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            num_classes=2,
            learning_rate=1e-3,
        )
        dummy_input = tf.random.uniform((1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3), maxval=255.0)
        output = model(dummy_input)
        self.assertEqual(output.shape, (1, 2))

    def test_05_efficientnet_output_shape(self):
        """5. Verify EfficientNet output shape (1, 2) when built without pretrained weights for test."""
        model, _ = build_efficientnet_model(
            input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3),
            num_classes=2,
            use_pretrained_weights=False,
        )
        dummy_input = tf.random.uniform((1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3), maxval=255.0)
        output = model(dummy_input)
        self.assertEqual(output.shape, (1, 2))

    def test_06_probability_output_properties(self):
        """6. Verify that probability outputs sum to 1.0 within floating tolerance."""
        model = build_cnn_model(input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3), num_classes=2)
        dummy_input = tf.random.uniform((2, IMAGE_SIZE[0], IMAGE_SIZE[1], 3), maxval=255.0)
        output = model(dummy_input).numpy()

        for row in output:
            self.assertAlmostEqual(float(np.sum(row)), 1.0, places=4)
            self.assertTrue(np.all(row >= 0.0))
            self.assertTrue(np.all(row <= 1.0))

    def test_07_metadata_consistency(self):
        """7. Verify metadata saving, loading, and mandatory food safety disclaimer."""
        fake_model_path = self.models_dir / "test_model.keras"
        fake_model_path.touch()

        meta_path = save_model_metadata(
            model_path=fake_model_path,
            architecture_name="test_arch",
            class_to_idx=CLASS_TO_INDEX,
            hyperparameters={"lr": 0.001, "epochs": 5},
            metrics={"val_acc": 0.95},
        )

        loaded = load_model_metadata(meta_path)
        self.assertEqual(loaded["architecture"], "test_arch")
        self.assertEqual(loaded["canonical_classes"], CANONICAL_CLASSES)
        self.assertIn("microbiological", loaded["food_safety_disclaimer"].lower())
        self.assertEqual(FOOD_SAFETY_DISCLAIMER, loaded["food_safety_disclaimer"])

    def test_08_missing_model_handling(self):
        """8. Verify inference loader and backend service report missing models properly."""
        with self.assertRaises(FileNotFoundError):
            load_inference_model("cnn", models_dir=self.models_dir)

        dummy_img = self.temp_dir / "sample.jpg"
        self._create_dummy_image(dummy_img)

        with self.assertRaises(FileNotFoundError):
            predict_image(dummy_img, model_identifier="cnn", models_dir=self.models_dir)

        # Backend service check
        svc = PredictionService(models_dir=self.models_dir)
        self.assertFalse(svc.is_model_available("best"))
        status = svc.get_model_status()
        self.assertFalse(status["service_ready"])
        self.assertEqual(len(status["available_models"]), 0)

    def test_09_metric_calculation_synthetic(self):
        """9. Verify calculation of accuracy, precision, recall, and confusion matrix on known values."""
        # Ground truth: 2 Fresh (0), 2 Spoiled (1)
        # Predictions: 1 Fresh, 3 Spoiled (one Fresh misclassified as Spoiled)
        y_true = np.array([0, 0, 1, 1])
        y_pred = np.array([0, 1, 1, 1])

        report = classification_report(y_true, y_pred, target_names=CANONICAL_CLASSES, output_dict=True)
        cm = confusion_matrix(y_true, y_pred)

        self.assertEqual(report["accuracy"], 0.75)
        # Fresh (0): True Pos = 1, False Neg = 1 -> Recall = 0.5
        self.assertEqual(report["Fresh"]["recall"], 0.5)
        # Spoiled (1): True Pos = 2, False Pos = 1 -> Precision = 2/3
        self.assertAlmostEqual(report["Spoiled"]["precision"], 2 / 3, places=3)
        self.assertEqual(cm[0, 0], 1)
        self.assertEqual(cm[0, 1], 1)
        self.assertEqual(cm[1, 0], 0)
        self.assertEqual(cm[1, 1], 2)

    def test_10_model_serialization_and_loading(self):
        """10. Verify Keras model saving to .keras format and reloading."""
        model = build_cnn_model(input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3), num_classes=2)
        save_path = self.models_dir / "serialized_test.keras"

        model.save(str(save_path))
        self.assertTrue(save_path.exists())

        reloaded = tf.keras.models.load_model(str(save_path))
        dummy_tensor = tf.ones((1, IMAGE_SIZE[0], IMAGE_SIZE[1], 3), dtype=tf.float32)

        orig_out = model(dummy_tensor).numpy()
        reloaded_out = reloaded(dummy_tensor).numpy()

        np.testing.assert_allclose(orig_out, reloaded_out, rtol=1e-5, atol=1e-5)


if __name__ == "__main__":
    unittest.main()
