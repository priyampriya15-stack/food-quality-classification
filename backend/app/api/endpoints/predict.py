"""Prediction API Endpoint.

Handles multipart image upload, validates image contents, executes model inference,
persists result to SQLite history, and returns structured prediction payload.
"""

import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_optional_current_user
from backend.app.core.database import get_db
from backend.app.models.prediction import PredictionRecord
from backend.app.models.user import User
from backend.app.schemas.prediction import PredictionResponse
from backend.app.services.prediction_service import prediction_service

logger = logging.getLogger("predict_endpoint")
router = APIRouter()


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify Food Quality",
    description="Upload a food image to assess quality (Fresh vs. Spoiled) using deep learning.",
)
async def predict_food_quality(
    file: UploadFile = File(..., description="Food image file (JPEG, PNG, WebP)"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Classify uploaded food item and persist result to database with user association."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid filename.",
        )

    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read upload stream: {e}",
        )

    # 1. Run inference
    try:
        pred_result = prediction_service.predict(
            image_bytes=image_bytes,
            filename=file.filename,
        )
    except ValueError as e:
        # Invalid image, empty file, unsupported extension, corrupt data
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except FileNotFoundError as e:
        # Model is missing / not trained
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Model is not loaded or trained. "
                "Please run model training ('python ml/src/train.py') to generate model weights."
            ),
        )
    except Exception as e:
        logger.error(f"Prediction inference error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal inference failure: {str(e)}",
        )

    # 2. Persist to SQLite (associated with current user if authenticated)
    try:
        user_id = current_user.id if current_user else None
        record = PredictionRecord(
            image_filename=pred_result["image_filename"],
            image_path=pred_result["image_path"],
            predicted_class=pred_result["predicted_class"],
            confidence=pred_result["confidence"],
            probabilities_json=json.dumps(pred_result["probabilities"]),
            latency_ms=pred_result["latency_ms"],
            model_name=pred_result["model_name"],
            user_id=user_id,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        pred_result["id"] = record.id
        pred_result["user_id"] = record.user_id
        pred_result["created_at"] = record.created_at

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to persist prediction history: {e}")
        # Note: Inference succeeded, but DB logging failed; return inference with null ID

    return pred_result
