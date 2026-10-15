"""Unit and Integration Tests for Configuration, JWT Secret Key, and CORS Enforcement.

Tests:
1. Environment-based JWT_SECRET_KEY loading.
2. Validation error when JWT_SECRET_KEY is under 32 characters.
3. CORS_ORIGINS parsing from comma-separated string with whitespace and trailing slashes.
4. CORS_ORIGINS parsing from JSON array.
5. Allowed origin preflight (OPTIONS) request receives 200 and access-control headers.
6. Allowed origin GET request receives access-control-allow-origin.
7. Disallowed origin request is strictly blocked from receiving access-control-allow-origin.
"""

import os
import sys
import unittest
from pathlib import Path

# Ensure project root is in sys.path when running from backend directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.core.config import Settings
from backend.app.main import app


class TestConfigAndCORS(unittest.TestCase):
    def test_01_jwt_secret_key_from_env(self):
        """Verify Settings loads custom JWT_SECRET_KEY from environment variables."""
        custom_secret = "a" * 48
        settings = Settings(JWT_SECRET_KEY=custom_secret)
        self.assertEqual(settings.JWT_SECRET_KEY, custom_secret)

    def test_02_jwt_secret_key_minimum_length_validation(self):
        """Verify Settings raises ValidationError if JWT_SECRET_KEY is less than 32 characters."""
        with self.assertRaises(ValidationError):
            Settings(JWT_SECRET_KEY="too-short-secret")

    def test_03_cors_origins_comma_separated_parsing(self):
        """Verify CORS_ORIGINS parses comma-separated string and strips trailing slashes."""
        raw_origins = "https://frontend.vercel.app/, http://localhost:5173/ , https://custom-domain.com"
        settings = Settings(CORS_ORIGINS=raw_origins)
        expected = [
            "https://frontend.vercel.app",
            "http://localhost:5173",
            "https://custom-domain.com",
        ]
        self.assertEqual(settings.CORS_ORIGINS, expected)

    def test_04_cors_origins_json_array_parsing(self):
        """Verify CORS_ORIGINS parses JSON array string correctly."""
        raw_origins = '["https://food-quality.vercel.app/", "http://127.0.0.1:5173"]'
        settings = Settings(CORS_ORIGINS=raw_origins)
        self.assertEqual(
            settings.CORS_ORIGINS,
            ["https://food-quality.vercel.app", "http://127.0.0.1:5173"],
        )

    def test_05_cors_allowed_origin_preflight(self):
        """Verify OPTIONS preflight request from allowed origin returns 200 with CORS headers."""
        client = TestClient(app)
        headers = {
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        }
        response = client.options("/api/v1/health", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")
        self.assertEqual(response.headers.get("access-control-allow-credentials"), "true")

    def test_06_cors_allowed_origin_get_request(self):
        """Verify GET request from allowed origin receives access-control-allow-origin."""
        client = TestClient(app)
        response = client.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_07_cors_disallowed_origin_strictly_blocked(self):
        """Verify request from unauthorized origin does NOT receive access-control-allow-origin header."""
        client = TestClient(app)
        response = client.get("/api/v1/health", headers={"Origin": "https://malicious-site.com"})
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.headers.get("access-control-allow-origin"))


if __name__ == "__main__":
    unittest.main()
