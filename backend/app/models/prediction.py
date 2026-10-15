"""SQLAlchemy ORM Model for Food Quality Prediction History."""

import datetime
import json
from typing import Any, Dict
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class PredictionRecord(Base):
    """Stores metadata and inference results for food quality classifications."""

    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    image_filename = Column(String(255), nullable=False)
    image_path = Column(String(500), nullable=True)  # Relative web-safe path (e.g., uploads/abc.jpg)
    predicted_class = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    probabilities_json = Column(Text, nullable=False)  # Serialized Dict[str, float]
    latency_ms = Column(Float, nullable=False)
    model_name = Column(String(100), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        server_default=func.now(),
        index=True,
        nullable=False,
    )

    # Relationship to user who requested prediction
    user = relationship("User", back_populates="predictions")

    @property
    def probabilities(self) -> Dict[str, float]:
        """Parse probabilities_json into dictionary."""
        try:
            return json.loads(self.probabilities_json)
        except Exception:
            return {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert record to JSON-friendly dictionary."""
        return {
            "id": self.id,
            "image_filename": self.image_filename,
            "image_path": self.image_path,
            "predicted_class": self.predicted_class,
            "confidence": self.confidence,
            "probabilities": self.probabilities,
            "latency_ms": self.latency_ms,
            "model_name": self.model_name,
            "user_id": self.user_id,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
