"""Comprehensive Unit & Integration Test Suite for Backend API & Database (Phase 4).

Tests:
1. Application health check and database connectivity probe.
2. Models endpoint status and metadata reporting.
3. Missing model handling returning HTTP 503.
4. Image validation rejecting 0-byte, corrupt, and unsupported file uploads with HTTP 400.
5. SQLite PredictionRecord persistence, pagination, filtering, and deletion.
6. Analytics calculations (totals, percentages, averages, daily trends).
7. End-to-end inference and history logging using a test model.
"""

import io
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock

# Ensure project root is in sys.path when running from backend directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.app.models.prediction import PredictionRecord
from backend.app.services.prediction_service import prediction_service


class TestBackendAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Setup an isolated temporary SQLite database for backend testing."""
        cls.temp_dir = Path(tempfile.mkdtemp(prefix="food_backend_test_"))
        cls.test_db_path = cls.temp_dir / "test_food_quality.db"
        cls.test_engine = create_engine(
            f"sqlite:///{cls.test_db_path}",
            connect_args={"check_same_thread": False},
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.test_engine,
        )

        # Override get_db dependency
        def override_get_db():
            db = cls.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        """Clean up temporary test workspace."""
        app.dependency_overrides.clear()
        cls.test_engine.dispose()
        if cls.temp_dir.exists():
            shutil.rmtree(cls.temp_dir, ignore_errors=True)

    def setUp(self):
        """Create fresh database tables before each test."""
        Base.metadata.create_all(bind=self.test_engine)
        self.db = self.TestingSessionLocal()

    def tearDown(self):
        """Drop tables and reset prediction service state after each test."""
        self.db.close()
        Base.metadata.drop_all(bind=self.test_engine)
        prediction_service._loaded_model = None
        prediction_service._is_loaded = False

    def _create_sample_jpeg_bytes(self, color=(100, 200, 50), size=(100, 100)) -> bytes:
        """Generate valid JPEG image bytes in memory."""
        img = Image.new("RGB", size, color=color)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return buf.getvalue()

    def test_01_health_check_endpoint(self):
        """Verify GET /api/v1/health returns 200 with database status."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["database_connected"])
        self.assertIn("disclaimer", data)

    def test_02_models_endpoint_reporting(self):
        """Verify GET /api/v1/models returns model metadata schema."""
        response = self.client.get("/api/v1/models")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("active_model", data)
        self.assertIn("available_models", data)
        self.assertIn("models_details", data)

    def test_03_predict_missing_model_returns_503(self):
        """Verify POST /api/v1/predict returns HTTP 503 when model is not trained."""
        # Ensure model is not loaded
        prediction_service._loaded_model = None
        prediction_service._is_loaded = False
        prediction_service.models_dir = self.temp_dir / "empty_models"

        img_bytes = self._create_sample_jpeg_bytes()
        files = {"file": ("test.jpg", img_bytes, "image/jpeg")}

        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 503)
        self.assertIn("not loaded or trained", response.json()["detail"])

    def test_04_image_upload_validation_errors(self):
        """Verify POST /api/v1/predict rejects corrupt, 0-byte, and unsupported files."""
        # 1. 0-byte file
        empty_files = {"file": ("empty.jpg", b"", "image/jpeg")}
        resp_empty = self.client.post("/api/v1/predict", files=empty_files)
        self.assertEqual(resp_empty.status_code, 400)
        self.assertIn("empty", resp_empty.json()["detail"].lower())

        # 2. Corrupt byte stream
        corrupt_files = {"file": ("corrupt.jpg", b"NOT_VALID_IMAGE_DATA", "image/jpeg")}
        resp_corrupt = self.client.post("/api/v1/predict", files=corrupt_files)
        self.assertEqual(resp_corrupt.status_code, 400)
        self.assertIn("corrupt", resp_corrupt.json()["detail"].lower())

        # 3. Unsupported extension
        txt_files = {"file": ("notes.txt", b"plain text content", "text/plain")}
        resp_txt = self.client.post("/api/v1/predict", files=txt_files)
        self.assertEqual(resp_txt.status_code, 400)
        self.assertIn("unsupported", resp_txt.json()["detail"].lower())

    def test_05_prediction_history_crud(self):
        """Verify SQLite prediction history persistence, pagination, and deletion."""
        # Seed 3 records
        for i in range(3):
            rec = PredictionRecord(
                image_filename=f"food_{i}.jpg",
                image_path=f"/uploads/pred_00{i}.jpg",
                predicted_class="Fresh" if i % 2 == 0 else "Spoiled",
                confidence=0.92 + i * 0.02,
                probabilities_json=json.dumps({"Fresh": 0.92, "Spoiled": 0.08}),
                latency_ms=35.0 + i,
                model_name="test_cnn",
            )
            self.db.add(rec)
        self.db.commit()

        # Query history
        resp = self.client.get("/api/v1/history?limit=10&offset=0")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total"], 3)
        self.assertEqual(len(data["items"]), 3)

        first_id = data["items"][0]["id"]

        # Query single item
        detail_resp = self.client.get(f"/api/v1/history/{first_id}")
        self.assertEqual(detail_resp.status_code, 200)
        self.assertEqual(detail_resp.json()["id"], first_id)

        # Delete single item
        del_resp = self.client.delete(f"/api/v1/history/{first_id}")
        self.assertEqual(del_resp.status_code, 200)

        # Check total decreased to 2
        resp_after = self.client.get("/api/v1/history")
        self.assertEqual(resp_after.json()["total"], 2)

        # Clear all
        clear_resp = self.client.delete("/api/v1/history")
        self.assertEqual(clear_resp.status_code, 200)
        resp_empty = self.client.get("/api/v1/history")
        self.assertEqual(resp_empty.json()["total"], 0)

    def test_06_analytics_calculations(self):
        """Verify analytics endpoint computes accurate totals, percentages, and averages."""
        # Seed 3 Fresh and 1 Spoiled
        records = [
            ("apple.jpg", "Fresh", 0.95, 30.0),
            ("banana.jpg", "Fresh", 0.90, 40.0),
            ("orange.jpg", "Fresh", 0.85, 50.0),
            ("rotten.jpg", "Spoiled", 0.98, 40.0),
        ]
        for name, cls_name, conf, lat in records:
            rec = PredictionRecord(
                image_filename=name,
                image_path=None,
                predicted_class=cls_name,
                confidence=conf,
                probabilities_json=json.dumps({cls_name: conf}),
                latency_ms=lat,
                model_name="test_model",
            )
            self.db.add(rec)
        self.db.commit()

        resp = self.client.get("/api/v1/analytics")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertEqual(data["total_predictions"], 4)
        self.assertEqual(data["class_counts"]["Fresh"], 3)
        self.assertEqual(data["class_counts"]["Spoiled"], 1)
        self.assertEqual(data["class_percentages"]["Fresh"], 75.0)
        self.assertEqual(data["class_percentages"]["Spoiled"], 25.0)
        self.assertAlmostEqual(data["average_confidence"], 0.92, places=2)
        self.assertEqual(data["average_latency_ms"], 40.0)
        self.assertTrue(len(data["recent_trends"]) >= 1)

    def test_07_mock_inference_and_persistence_flow(self):
        """Verify successful prediction flow with mock Keras model and database logging."""
        # Setup mock model on prediction_service
        mock_model = MagicMock()
        # Returns batch prediction: [[0.88, 0.12]] -> Fresh
        mock_model.predict.return_value = np.array([[0.88, 0.12]], dtype=np.float32)

        prediction_service._loaded_model = mock_model
        prediction_service._loaded_metadata = {
            "architecture": "mock_cnn",
            "idx_to_class": {0: "Fresh", 1: "Spoiled"},
            "input_shape": [224, 224, 3],
        }
        prediction_service._is_loaded = True

        img_bytes = self._create_sample_jpeg_bytes()
        files = {"file": ("fresh_apple.jpg", img_bytes, "image/jpeg")}

        response = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIsNotNone(data["id"])
        self.assertEqual(data["predicted_class"], "Fresh")
        self.assertAlmostEqual(data["confidence"], 0.88, places=2)
        self.assertEqual(data["probabilities"]["Fresh"], 0.88)
        self.assertEqual(data["probabilities"]["Spoiled"], 0.12)
        self.assertIn("microbiological", data["disclaimer"].lower())

        # Verify entry exists in SQLite
        db_record = self.db.query(PredictionRecord).filter(PredictionRecord.id == data["id"]).first()
        self.assertIsNotNone(db_record)
        self.assertEqual(db_record.predicted_class, "Fresh")

    def test_08_update_prediction_notes(self):
        """Verify PATCH /api/v1/history/{id} updates notes in database."""
        # Create record in DB
        record = PredictionRecord(
            image_filename="sample_orange.jpg",
            image_path="/uploads/sample_orange.jpg",
            predicted_class="Fresh",
            confidence=0.92,
            probabilities_json=json.dumps({"Fresh": 0.92, "Spoiled": 0.08}),
            latency_ms=45.0,
            model_name="best",
            notes=None,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        # Update note via API
        patch_resp = self.client.patch(
            f"/api/v1/history/{record.id}",
            json={"notes": "Organic batch #42 - inspected"},
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.json()["notes"], "Organic batch #42 - inspected")

        # Verify directly in SQLite DB
        self.db.refresh(record)
        self.assertEqual(record.notes, "Organic batch #42 - inspected")

        # Verify update on nonexistent ID returns 404
        nonexistent_resp = self.client.patch(
            "/api/v1/history/999999",
            json={"notes": "Phantom record"},
        )
        self.assertEqual(nonexistent_resp.status_code, 404)

    def test_09_analytics_reflects_newly_saved_prediction_and_history(self):
        """Verify analytics and history dynamically reflect newly saved predictions."""
        # 1. Initially empty
        empty_analytics = self.client.get("/api/v1/analytics")
        self.assertEqual(empty_analytics.status_code, 200)
        self.assertEqual(empty_analytics.json()["total_predictions"], 0)
        self.assertEqual(empty_analytics.json()["class_counts"]["Fresh"], 0)
        self.assertEqual(empty_analytics.json()["class_counts"]["Spoiled"], 0)

        # 2. Add mock inference model
        mock_model = MagicMock()
        mock_model.predict.return_value = np.array([[0.10, 0.90]], dtype=np.float32)  # Spoiled
        prediction_service._loaded_model = mock_model
        prediction_service._loaded_metadata = {
            "architecture": "test_cnn",
            "idx_to_class": {0: "Fresh", 1: "Spoiled"},
            "input_shape": [224, 224, 3],
        }
        prediction_service._is_loaded = True

        img_bytes = self._create_sample_jpeg_bytes()
        files = {"file": ("spoiled_tomato.jpg", img_bytes, "image/jpeg")}
        pred_resp = self.client.post("/api/v1/predict", files=files)
        self.assertEqual(pred_resp.status_code, 200)
        pred_id = pred_resp.json()["id"]
        self.assertEqual(pred_resp.json()["predicted_class"], "Spoiled")

        # 3. Analytics immediately reflects the newly saved prediction
        analytics_after = self.client.get("/api/v1/analytics")
        self.assertEqual(analytics_after.status_code, 200)
        data = analytics_after.json()
        self.assertEqual(data["total_predictions"], 1)
        self.assertEqual(data["class_counts"]["Spoiled"], 1)
        self.assertEqual(data["class_counts"]["Fresh"], 0)
        self.assertEqual(data["class_percentages"]["Spoiled"], 100.0)

        # 4. History immediately returns the record
        history_resp = self.client.get("/api/v1/history")
        self.assertEqual(history_resp.status_code, 200)
        self.assertEqual(history_resp.json()["total"], 1)
        self.assertEqual(history_resp.json()["items"][0]["id"], pred_id)
        self.assertEqual(history_resp.json()["items"][0]["image_filename"], "spoiled_tomato.jpg")

    def test_10_persistence_across_database_sessions(self):
        """Verify prediction record persists across database session closure and new session creation."""
        # 1. Create and commit a prediction record in current session
        rec = PredictionRecord(
            image_filename="persistent_fresh_apple.jpg",
            image_path="/uploads/persistent.jpg",
            predicted_class="Fresh",
            confidence=0.985,
            probabilities_json=json.dumps({"Fresh": 0.985, "Spoiled": 0.015}),
            latency_ms=28.5,
            model_name="best_cnn",
        )
        self.db.add(rec)
        self.db.commit()
        record_id = rec.id

        # 2. Close current session to simulate session boundary
        self.db.close()

        # 3. Open a completely brand new session from the SQLite engine
        new_session = self.TestingSessionLocal()
        try:
            persisted = new_session.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
            self.assertIsNotNone(persisted)
            self.assertEqual(persisted.image_filename, "persistent_fresh_apple.jpg")
            self.assertEqual(persisted.predicted_class, "Fresh")
            self.assertAlmostEqual(persisted.confidence, 0.985, places=3)
            self.assertEqual(persisted.probabilities["Fresh"], 0.985)
        finally:
            new_session.close()
            # Reopen standard session for tearDown
            self.db = self.TestingSessionLocal()


if __name__ == "__main__":
    unittest.main()
