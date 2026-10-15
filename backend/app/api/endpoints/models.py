"""Model Management API Endpoints.

Provides inspection of available deep learning models, loaded status, metadata,
and active model switching.
"""

from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.prediction import ModelInfoResponse, SwitchModelRequest
from backend.app.services.prediction_service import prediction_service

router = APIRouter()


@router.get(
    "/models",
    response_model=ModelInfoResponse,
    summary="Get Model Status and Metadata",
)
def get_model_status():
    """Return status, active architecture, and metadata for available deep learning models."""
    available = prediction_service.get_available_models()
    details = prediction_service.get_model_details()

    message = (
        f"Active model: '{prediction_service.active_model_name}' (Loaded: {prediction_service._is_loaded}). "
        f"Available checkpoints: {available}."
    )
    if not available:
        message = (
            "No trained model checkpoints discovered in 'ml/models/'. "
            "Execute 'python ml/src/train.py' after preparing your dataset."
        )

    return ModelInfoResponse(
        active_model=prediction_service.active_model_name,
        is_loaded=prediction_service._is_loaded,
        available_models=available,
        model_status_message=message,
        models_details=details,
    )


@router.post(
    "/models/switch",
    summary="Switch Active Inference Model",
)
def switch_active_model(payload: SwitchModelRequest):
    """Switch active model between 'best', 'cnn', and 'efficientnet'."""
    success, msg = prediction_service.switch_model(payload.model_name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    return {
        "success": True,
        "message": msg,
        "active_model": prediction_service.active_model_name,
        "is_loaded": prediction_service._is_loaded,
    }
