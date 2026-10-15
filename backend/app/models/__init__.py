"""SQLAlchemy ORM models package."""

from backend.app.models.prediction import PredictionRecord
from backend.app.models.user import User

__all__ = ["PredictionRecord", "User"]
