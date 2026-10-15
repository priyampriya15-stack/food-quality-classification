"""Prediction History Endpoints.

Provides paginated query access, single record lookup, and deletion of past predictions.
"""

from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_optional_current_user
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models.prediction import PredictionRecord
from backend.app.models.user import User
from backend.app.schemas.prediction import (
    PredictionHistoryItem,
    PredictionHistoryResponse,
    PredictionUpdate,
)

router = APIRouter()


@router.get(
    "/history",
    response_model=PredictionHistoryResponse,
    summary="List Prediction History",
    description="Retrieve paginated history of past food quality classifications for current user.",
)
def get_prediction_history(
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
    class_name: Optional[str] = Query(None, description="Filter by class ('Fresh' or 'Spoiled')"),
    model_name: Optional[str] = Query(None, description="Filter by model architecture"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated prediction records ordered by newest first, scoped to current user."""
    query = db.query(PredictionRecord)

    # User isolation: authenticated users see their own records, guest sees unassociated records
    if current_user:
        query = query.filter(PredictionRecord.user_id == current_user.id)
    else:
        query = query.filter(PredictionRecord.user_id.is_(None))

    if class_name:
        query = query.filter(PredictionRecord.predicted_class == class_name)
    if model_name:
        query = query.filter(PredictionRecord.model_name.ilike(f"%{model_name}%"))

    total = query.count()
    records = query.order_by(PredictionRecord.created_at.desc()).offset(offset).limit(limit).all()

    items = [
        PredictionHistoryItem(
            id=r.id,
            image_filename=r.image_filename,
            image_path=r.image_path,
            predicted_class=r.predicted_class,
            confidence=r.confidence,
            probabilities=r.probabilities,
            latency_ms=r.latency_ms,
            model_name=r.model_name,
            user_id=r.user_id,
            notes=r.notes,
            created_at=r.created_at,
        )
        for r in records
    ]

    return PredictionHistoryResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=items,
    )


@router.get(
    "/history/{prediction_id}",
    response_model=PredictionHistoryItem,
    summary="Get Prediction Detail",
)
def get_prediction_detail(
    prediction_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Get full details of a specific prediction by ID, ensuring user authorization."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {prediction_id} not found.",
        )

    # Prevent cross-user record inspection
    if current_user and record.user_id is not None and record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {prediction_id} not found.",
        )

    return PredictionHistoryItem(
        id=record.id,
        image_filename=record.image_filename,
        image_path=record.image_path,
        predicted_class=record.predicted_class,
        confidence=record.confidence,
        probabilities=record.probabilities,
        latency_ms=record.latency_ms,
        model_name=record.model_name,
        user_id=record.user_id,
        notes=record.notes,
        created_at=record.created_at,
    )


@router.patch(
    "/history/{prediction_id}",
    response_model=PredictionHistoryItem,
    summary="Update Prediction Record Notes",
)
def update_prediction_notes(
    prediction_id: int,
    payload: PredictionUpdate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Update user notes on a prediction record in the real database."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {prediction_id} not found.",
        )

    if current_user and record.user_id is not None and record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update another user's prediction record.",
        )

    if payload.notes is not None:
        record.notes = payload.notes.strip()

    db.commit()
    db.refresh(record)

    return PredictionHistoryItem(
        id=record.id,
        image_filename=record.image_filename,
        image_path=record.image_path,
        predicted_class=record.predicted_class,
        confidence=record.confidence,
        probabilities=record.probabilities,
        latency_ms=record.latency_ms,
        model_name=record.model_name,
        user_id=record.user_id,
        notes=record.notes,
        created_at=record.created_at,
    )


@router.delete(
    "/history/{prediction_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Prediction Record",
)
def delete_prediction(
    prediction_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Delete a prediction record and its stored preview image if present, checking user ownership."""
    record = db.query(PredictionRecord).filter(PredictionRecord.id == prediction_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with ID {prediction_id} not found.",
        )

    # Restrict deletion to record owner
    if current_user and record.user_id is not None and record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete another user's prediction record.",
        )

    # Attempt to clean up saved file
    if record.image_path and record.image_path.startswith("/uploads/"):
        filename = record.image_path.replace("/uploads/", "")
        local_file = settings.uploads_path / filename
        if local_file.exists() and local_file.is_file():
            try:
                local_file.unlink()
            except Exception:
                pass

    db.delete(record)
    db.commit()

    return {"message": f"Prediction record {prediction_id} deleted successfully."}


@router.delete(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Clear All Prediction History",
)
def clear_all_history(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Delete all prediction history records belonging to the current user."""
    if current_user:
        count = db.query(PredictionRecord).filter(PredictionRecord.user_id == current_user.id).delete()
    else:
        count = db.query(PredictionRecord).filter(PredictionRecord.user_id.is_(None)).delete()
    db.commit()

    return {"message": f"Successfully cleared {count} prediction history records."}
