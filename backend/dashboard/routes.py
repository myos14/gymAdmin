from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from .schemas import DashboardSummary
from .services import (
    get_dashboard_metrics,
    get_payment_metrics,
    get_expiring_subscriptions,
    get_recent_checkins,
    get_recent_payments,
    get_weekly_attendance_stats,
    get_weekly_income_stats,
    get_plan_metrics
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    expiring_days: int = Query(default=7, ge=1, le=30, description="Días para alertas de vencimiento"),
    recent_limit: int = Query(default=5, ge=5, le=50, description="Límite de check-ins recientes"),
    stats_days: int = Query(default=7, ge=1, le=30, description="Días para estadísticas"),
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard summary with all metrics, alerts, and stats
    
    Returns:
    - metrics: Current gym status and totals
    - expiring_subscriptions: Subscriptions expiring soon
    - recent_checkins: Latest check-ins
    - weekly_stats: Attendance statistics for last N days
    """
    
    return DashboardSummary(
        metrics=get_dashboard_metrics(db),
        payment_metrics=get_payment_metrics(db),
        expiring_subscriptions=get_expiring_subscriptions(db, days=expiring_days),
        recent_checkins=get_recent_checkins(db, limit=5),
        recent_payments=get_recent_payments(db, limit=recent_limit),
        weekly_stats=get_weekly_attendance_stats(db, days=stats_days),
        weekly_income=get_weekly_income_stats(db, days=stats_days),
        plan_metrics=get_plan_metrics(db)
    )