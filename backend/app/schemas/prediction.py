"""Pydantic Request and Response Schemas for Food Quality System."""

import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Schema returned by POST /api/v1/predict."""
    id: Optional[int] = Field(None, description="Database record ID")
    image_filename: str = Field(..., description="Original name of the uploaded image")
    image_path: Optional[str] = Field(None, description="Web-accessible preview path")
    predicted_class: str = Field(..., description="Classification outcome ('Fresh' or 'Spoiled')")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    confidence_percentage: str = Field(..., description="Formatted confidence percentage")
    probabilities: Dict[str, float] = Field(..., description="Per-class probability distribution")
    latency_ms: float = Field(..., description="Model inference duration in milliseconds")
    model_name: str = Field(..., description="Active model architecture used for prediction")
    disclaimer: str = Field(..., description="Mandatory food safety limitation statement")
    user_id: Optional[int] = Field(None, description="ID of authenticated user who initiated inference")
    notes: Optional[str] = Field(None, description="Optional user note or assessment tag")
    created_at: Optional[datetime.datetime] = Field(None, description="Timestamp of inference")


class PredictionUpdate(BaseModel):
    """Payload to update notes or tags for a prediction record."""
    notes: Optional[str] = Field(None, max_length=500, description="User assessment notes or tags")


class PredictionHistoryItem(BaseModel):
    """Single item in prediction history list."""
    id: int
    image_filename: str
    image_path: Optional[str] = None
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]
    latency_ms: float
    model_name: str
    user_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class PredictionHistoryResponse(BaseModel):
    """Paginated list of prediction history records."""
    total: int
    limit: int
    offset: int
    items: List[PredictionHistoryItem]


class AnalyticsSummary(BaseModel):
    """Aggregated prediction statistics for analytics dashboard."""
    total_predictions: int
    class_counts: Dict[str, int]
    class_percentages: Dict[str, float]
    average_confidence: float
    average_latency_ms: float
    recent_trends: List[Dict[str, Any]]
    model_usage_breakdown: Dict[str, int]


class ModelInfoResponse(BaseModel):
    """Status and metadata for deep learning models."""
    active_model: str
    is_loaded: bool
    available_models: List[str]
    model_status_message: str
    models_details: Dict[str, Any]


class SwitchModelRequest(BaseModel):
    """Request payload to switch the active inference model."""
    model_name: str = Field(..., description="Target model name ('best', 'cnn', 'efficientnet')")


class HealthResponse(BaseModel):
    """System health and readiness check response."""
    status: str
    version: str
    database_connected: bool
    model_ready: bool
    active_model: str
    disclaimer: str
