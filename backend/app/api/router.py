"""API v1 Route Aggregator."""

from fastapi import APIRouter
from backend.app.api.endpoints import analytics, auth, health, history, models, predict

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(predict.router, tags=["Prediction"])
api_router.include_router(history.router, tags=["History"])
api_router.include_router(analytics.router, tags=["Analytics"])
api_router.include_router(models.router, tags=["Models"])
api_router.include_router(health.router, tags=["Health"])
