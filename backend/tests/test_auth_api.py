"""Unit and Integration Test Suite for Authentication & User-Specific Prediction History.

Tests:
1. Successful user registration (201 Created) returning JWT access token.
2. Duplicate email rejection (400 Bad Request).
3. Registration input validation (password < 6 chars, invalid email).
4. Successful login (200 OK) returning valid JWT token.
5. Login failure with wrong password (401 Unauthorized).
6. Login failure with non-existent email (401 Unauthorized).
7. Profile endpoint GET /api/v1/auth/me with Bearer token (200 OK).
8. Profile endpoint without Bearer token (401 Unauthorized).
9. Forgot password token generation.
10. Reset password flow allowing subsequent login with new password.
11. User-specific prediction isolation:
    - User A and User B have separate prediction histories.
    - User A cannot delete User B's predictions (403 Forbidden).
    - User A can delete their own predictions.
"""

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

# Ensure project root is in sys.path when running from backend directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.database import Base, get_db
from backend.app.main import app
from backend.app.models.prediction import PredictionRecord
from backend.app.models.user import User


class TestAuthAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Setup an isolated temporary SQLite database for authentication testing."""
        cls.temp_dir = Path(tempfile.mkdtemp(prefix="food_auth_test_"))
        cls.test_db_path = cls.temp_dir / "test_auth.db"
        cls.test_engine = create_engine(
            f"sqlite:///{cls.test_db_path}",
            connect_args={"check_same_thread": False},
        )
        cls.TestingSessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=cls.test_engine,
        )

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
        """Drop tables after each test."""
        self.db.close()
        Base.metadata.drop_all(bind=self.test_engine)

    def test_01_user_registration_success(self):
        """Verify successful user registration returns 201 with JWT token."""
        payload = {
            "name": "Alice Tester",
            "email": "alice@example.com",
            "password": "Password123!",
        }
        response = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()

        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")
        self.assertEqual(data["user"]["name"], "Alice Tester")
        self.assertEqual(data["user"]["email"], "alice@example.com")
        self.assertTrue(data["user"]["is_active"])

        # Check password is not plaintext in DB
        user_in_db = self.db.query(User).filter(User.email == "alice@example.com").first()
        self.assertIsNotNone(user_in_db)
        self.assertNotEqual(user_in_db.hashed_password, "Password123!")
        self.assertTrue(user_in_db.hashed_password.startswith("$2b$"))

    def test_02_duplicate_email_registration_fails(self):
        """Verify registering with already existing email returns 400."""
        payload = {
            "name": "Bob Original",
            "email": "bob@example.com",
            "password": "SecretPassword123",
        }
        self.client.post("/api/v1/auth/register", json=payload)

        # Attempt duplicate
        dup_payload = {
            "name": "Bob Duplicate",
            "email": "bob@example.com",
            "password": "DifferentPassword456",
        }
        response = self.client.post("/api/v1/auth/register", json=dup_payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("already registered", response.json()["detail"].lower())

    def test_03_registration_validation(self):
        """Verify registration rejects passwords shorter than 6 chars and invalid emails."""
        # Short password
        resp_short = self.client.post(
            "/api/v1/auth/register",
            json={"name": "Short", "email": "valid@example.com", "password": "123"},
        )
        self.assertEqual(resp_short.status_code, 422)

        # Invalid email
        resp_bad_email = self.client.post(
            "/api/v1/auth/register",
            json={"name": "Bad Email", "email": "not-an-email", "password": "Password123"},
        )
        self.assertEqual(resp_bad_email.status_code, 422)

    def test_04_user_login_success_and_failure(self):
        """Verify user login with valid vs invalid credentials."""
        # Register user
        reg_payload = {
            "name": "Charlie Chaplin",
            "email": "charlie@example.com",
            "password": "StrongPassword99!",
        }
        self.client.post("/api/v1/auth/register", json=reg_payload)

        # Valid login
        resp_login = self.client.post(
            "/api/v1/auth/login",
            json={"email": "charlie@example.com", "password": "StrongPassword99!"},
        )
        self.assertEqual(resp_login.status_code, 200)
        token_data = resp_login.json()
        self.assertIn("access_token", token_data)
        self.assertEqual(token_data["user"]["email"], "charlie@example.com")

        # Wrong password
        resp_wrong = self.client.post(
            "/api/v1/auth/login",
            json={"email": "charlie@example.com", "password": "WrongPassword!"},
        )
        self.assertEqual(resp_wrong.status_code, 401)
        self.assertIn("invalid email or password", resp_wrong.json()["detail"].lower())

        # Non-existent email
        resp_ghost = self.client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "Password123!"},
        )
        self.assertEqual(resp_ghost.status_code, 401)

    def test_05_profile_endpoint_protection(self):
        """Verify GET /api/v1/auth/me requires valid Bearer token."""
        # Register & login
        reg_payload = {"name": "Dana Scully", "email": "scully@fbi.gov", "password": "TrustNoOne123"}
        reg_resp = self.client.post("/api/v1/auth/register", json=reg_payload)
        token = reg_resp.json()["access_token"]

        # Request with valid token
        headers = {"Authorization": f"Bearer {token}"}
        resp_me = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(resp_me.status_code, 200)
        self.assertEqual(resp_me.json()["email"], "scully@fbi.gov")

        # Request without token
        resp_no_token = self.client.get("/api/v1/auth/me")
        self.assertEqual(resp_no_token.status_code, 401)

        # Request with forged token
        resp_bad_token = self.client.get("/api/v1/auth/me", headers={"Authorization": "Bearer fake.jwt.token"})
        self.assertEqual(resp_bad_token.status_code, 401)

    def test_06_forgot_and_reset_password_flow(self):
        """Verify generating reset token and updating password allows login with new password."""
        # Register user
        reg_payload = {"name": "Eve Polastri", "email": "eve@mi6.gov", "password": "OldPassword123"}
        self.client.post("/api/v1/auth/register", json=reg_payload)

        # Request forgot password
        forgot_resp = self.client.post("/api/v1/auth/forgot-password", json={"email": "eve@mi6.gov"})
        self.assertEqual(forgot_resp.status_code, 200)
        reset_token = forgot_resp.json()["reset_token"]
        self.assertIsNotNone(reset_token)

        # Reset password
        reset_payload = {"token": reset_token, "new_password": "NewSecretPassword456!"}
        reset_resp = self.client.post("/api/v1/auth/reset-password", json=reset_payload)
        self.assertEqual(reset_resp.status_code, 200)
        self.assertTrue(reset_resp.json()["success"])

        # Login with old password fails
        resp_old = self.client.post(
            "/api/v1/auth/login",
            json={"email": "eve@mi6.gov", "password": "OldPassword123"},
        )
        self.assertEqual(resp_old.status_code, 401)

        # Login with new password succeeds
        resp_new = self.client.post(
            "/api/v1/auth/login",
            json={"email": "eve@mi6.gov", "password": "NewSecretPassword456!"},
        )
        self.assertEqual(resp_new.status_code, 200)
        self.assertIn("access_token", resp_new.json())

    def test_07_user_prediction_history_isolation_and_ownership(self):
        """Verify User A and User B have separate prediction histories and cannot delete each other's records."""
        # Register User A
        res_a = self.client.post(
            "/api/v1/auth/register",
            json={"name": "User Alpha", "email": "alpha@example.com", "password": "Password123!"},
        )
        token_a = res_a.json()["access_token"]
        id_a = res_a.json()["user"]["id"]
        headers_a = {"Authorization": f"Bearer {token_a}"}

        # Register User B
        res_b = self.client.post(
            "/api/v1/auth/register",
            json={"name": "User Beta", "email": "beta@example.com", "password": "Password123!"},
        )
        token_b = res_b.json()["access_token"]
        id_b = res_b.json()["user"]["id"]
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Seed 2 predictions for User A and 1 prediction for User B
        rec_a1 = PredictionRecord(
            image_filename="apple_a1.jpg",
            image_path=None,
            predicted_class="Fresh",
            confidence=0.96,
            probabilities_json=json.dumps({"Fresh": 0.96, "Spoiled": 0.04}),
            latency_ms=25.0,
            model_name="cnn",
            user_id=id_a,
        )
        rec_a2 = PredictionRecord(
            image_filename="banana_a2.jpg",
            image_path=None,
            predicted_class="Spoiled",
            confidence=0.91,
            probabilities_json=json.dumps({"Fresh": 0.09, "Spoiled": 0.91}),
            latency_ms=28.0,
            model_name="cnn",
            user_id=id_a,
        )
        rec_b1 = PredictionRecord(
            image_filename="orange_b1.jpg",
            image_path=None,
            predicted_class="Fresh",
            confidence=0.99,
            probabilities_json=json.dumps({"Fresh": 0.99, "Spoiled": 0.01}),
            latency_ms=22.0,
            model_name="efficientnet",
            user_id=id_b,
        )
        self.db.add_all([rec_a1, rec_a2, rec_b1])
        self.db.commit()

        # User A checks history -> only sees 2 records
        hist_a = self.client.get("/api/v1/history", headers=headers_a)
        self.assertEqual(hist_a.status_code, 200)
        self.assertEqual(hist_a.json()["total"], 2)
        filenames_a = [item["image_filename"] for item in hist_a.json()["items"]]
        self.assertIn("apple_a1.jpg", filenames_a)
        self.assertIn("banana_a2.jpg", filenames_a)
        self.assertNotIn("orange_b1.jpg", filenames_a)

        # User B checks history -> only sees 1 record
        hist_b = self.client.get("/api/v1/history", headers=headers_b)
        self.assertEqual(hist_b.status_code, 200)
        self.assertEqual(hist_b.json()["total"], 1)
        self.assertEqual(hist_b.json()["items"][0]["image_filename"], "orange_b1.jpg")

        # User A attempts to delete User B's record (rec_b1.id) -> 403 Forbidden
        del_attempt = self.client.delete(f"/api/v1/history/{rec_b1.id}", headers=headers_a)
        self.assertEqual(del_attempt.status_code, 403)
        self.assertIn("not authorized", del_attempt.json()["detail"].lower())

        # User B deletes their own record (rec_b1.id) -> 200 OK
        del_own = self.client.delete(f"/api/v1/history/{rec_b1.id}", headers=headers_b)
        self.assertEqual(del_own.status_code, 200)

        # User B history is now empty
        hist_b_after = self.client.get("/api/v1/history", headers=headers_b)
        self.assertEqual(hist_b_after.json()["total"], 0)

    def test_08_update_user_profile(self):
        """Verify PUT /api/v1/auth/me updates user profile in database."""
        # Register user
        reg_resp = self.client.post(
            "/api/v1/auth/register",
            json={"name": "Original Name", "email": "update_test@example.com", "password": "password123"},
        )
        self.assertEqual(reg_resp.status_code, 201)
        token = reg_resp.json()["access_token"]
        user_id = reg_resp.json()["user"]["id"]
        headers = {"Authorization": f"Bearer {token}"}

        # Update profile name
        update_resp = self.client.put(
            "/api/v1/auth/me",
            json={"name": "Updated Professional Name"},
            headers=headers,
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["name"], "Updated Professional Name")

        # Verify via GET /api/v1/auth/me
        get_resp = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["name"], "Updated Professional Name")

        # Verify directly in SQLite DB
        user = self.db.query(User).filter(User.id == user_id).first()
        self.db.refresh(user)
        self.assertEqual(user.name, "Updated Professional Name")

        # Test unauthenticated update -> 401
        unauth_resp = self.client.put("/api/v1/auth/me", json={"name": "Hacker Name"})
        self.assertEqual(unauth_resp.status_code, 401)

        # Test invalid name (< 2 chars) -> 422
        invalid_resp = self.client.put(
            "/api/v1/auth/me",
            json={"name": "X"},
            headers=headers,
        )
        self.assertEqual(invalid_resp.status_code, 422)


if __name__ == "__main__":
    unittest.main()
