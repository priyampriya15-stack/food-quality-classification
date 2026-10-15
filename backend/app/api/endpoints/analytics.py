"""Analytics API Endpoints.

Calculates aggregated metrics, quality class ratios, average confidence, latency,
and temporal trends for the dashboard.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_optional_current_user
from backend.app.core.database import get_db
from backend.app.models.prediction import PredictionRecord
from backend.app.models.user import User
from backend.app.schemas.prediction import AnalyticsSummary

router = APIRouter()


@router.get(
    "/analytics",
    response_model=AnalyticsSummary,
    summary="Get Analytics Summary",
    description="Returns aggregated quality metrics, class distributions, and daily trends for current user.",
)
def get_analytics_summary(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate statistics across recorded predictions for the current user."""
    base_query = db.query(PredictionRecord)
    if current_user:
        base_query = base_query.filter(PredictionRecord.user_id == current_user.id)
    else:
        base_query = base_query.filter(PredictionRecord.user_id.is_(None))

    total_count = base_query.count()

    if total_count == 0:
        return AnalyticsSummary(
            total_predictions=0,
            class_counts={"Fresh": 0, "Spoiled": 0},
            class_percentages={"Fresh": 0.0, "Spoiled": 0.0},
            average_confidence=0.0,
            average_latency_ms=0.0,
            recent_trends=[],
            model_usage_breakdown={},
        )

    # 1. Class Counts & Percentages
    class_q = db.query(
        PredictionRecord.predicted_class,
        func.count(PredictionRecord.id),
    )
    if current_user:
        class_q = class_q.filter(PredictionRecord.user_id == current_user.id)
    else:
        class_q = class_q.filter(PredictionRecord.user_id.is_(None))
    class_rows = class_q.group_by(PredictionRecord.predicted_class).all()
    class_counts: Dict[str, int] = {"Fresh": 0, "Spoiled": 0}
    for cls_name, count in class_rows:
        class_counts[cls_name] = count

    class_percentages: Dict[str, float] = {
        cls: round((count / total_count) * 100.0, 1)
        for cls, count in class_counts.items()
    }

    # 2. Averages
    avg_q = db.query(
        func.avg(PredictionRecord.confidence),
        func.avg(PredictionRecord.latency_ms),
    )
    if current_user:
        avg_q = avg_q.filter(PredictionRecord.user_id == current_user.id)
    else:
        avg_q = avg_q.filter(PredictionRecord.user_id.is_(None))
    avg_stats = avg_q.first()

    avg_conf = round(float(avg_stats[0] or 0.0), 4)
    avg_lat = round(float(avg_stats[1] or 0.0), 2)

    # 3. Model Breakdown
    model_q = db.query(
        PredictionRecord.model_name,
        func.count(PredictionRecord.id),
    )
    if current_user:
        model_q = model_q.filter(PredictionRecord.user_id == current_user.id)
    else:
        model_q = model_q.filter(PredictionRecord.user_id.is_(None))
    model_rows = model_q.group_by(PredictionRecord.model_name).all()
    model_usage: Dict[str, int] = {row[0]: row[1] for row in model_rows}

    # 4. Recent Daily Trends (grouped by date)
    trends_q = db.query(
        PredictionRecord.created_at,
        PredictionRecord.predicted_class,
    )
    if current_user:
        trends_q = trends_q.filter(PredictionRecord.user_id == current_user.id)
    else:
        trends_q = trends_q.filter(PredictionRecord.user_id.is_(None))
    recent_records = trends_q.order_by(PredictionRecord.created_at.asc()).limit(500).all()

    daily_map: Dict[str, Dict[str, int]] = defaultdict(lambda: {"Fresh": 0, "Spoiled": 0, "total": 0})
    for dt, cls_name in recent_records:
        if dt:
            date_str = dt.strftime("%Y-%m-%d")
            daily_map[date_str][cls_name] = daily_map[date_str].get(cls_name, 0) + 1
            daily_map[date_str]["total"] += 1

    recent_trends: List[Dict[str, Any]] = [
        {"date": date_str, **counts}
        for date_str, counts in sorted(daily_map.items())
    ]

    return AnalyticsSummary(
        total_predictions=total_count,
        class_counts=class_counts,
        class_percentages=class_percentages,
        average_confidence=avg_conf,
        average_latency_ms=avg_lat,
        recent_trends=recent_trends,
        model_usage_breakdown=model_usage,
    )
