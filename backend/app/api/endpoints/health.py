"""Health Check Endpoint."""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.schemas.prediction import HealthResponse
from backend.app.services.prediction_service import FOOD_SAFETY_DISCLAIMER, prediction_service

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health and Readiness Check",
)
def health_check(db: Session = Depends(get_db)):
    """Verify backend API, database connectivity, and model availability."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    model_ready = prediction_service.is_model_available()

    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        version=settings.APP_VERSION,
        database_connected=db_ok,
        model_ready=model_ready,
        active_model=prediction_service.active_model_name,
        disclaimer=FOOD_SAFETY_DISCLAIMER,
    )
