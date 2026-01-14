from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import date, timedelta
from typing import List

from members.models import Member
from subscriptions.models import Subscription
from attendance.models import Attendance
from plans.models import Plan
from .schemas import (
    DashboardMetrics,
    PaymentMetrics,
    ExpiringSubscription,
    RecentCheckIn,
    RecentPayment,
    DailyAttendanceStats,
    DailyIncomeStats,
    MemberBasicInfo,
    PlanBasicInfo
)

SPANISH_DAYS = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo"
}

def get_dashboard_metrics(db: Session) -> DashboardMetrics:
    """Get main dashboard metrics"""
    today = date.today()
    
    current_in_gym = db.query(Attendance).filter(
        and_(
            Attendance.date == today,
            Attendance.check_out_time.is_(None)
        )
    ).count()
    
    today_visits = db.query(Attendance).filter(Attendance.date == today).count()
    
    total_members = db.query(Member).filter(Member.is_active == True).count()
    
    active_subscriptions = db.query(Subscription).filter(
        and_(
            Subscription.status == "active",
            Subscription.end_date >= today
        )
    ).count()
    
    return DashboardMetrics(
        current_in_gym=current_in_gym,
        today_visits=today_visits,
        total_members=total_members,
        active_subscriptions=active_subscriptions
    )

def get_expiring_subscriptions(db: Session, days: int = 7) -> List[ExpiringSubscription]:
    """Get subscriptions expiring in the next X days"""
    today = date.today()
    end_date = today + timedelta(days=days)
    
    subscriptions = db.query(Subscription).join(
        Member, Subscription.member_id == Member.id
    ).join(
        Plan, Subscription.plan_id == Plan.id
    ).filter(
        and_(
            Subscription.status == "active",
            Subscription.end_date >= today,
            Subscription.end_date <= end_date
        )
    ).order_by(Subscription.end_date.asc()).all()
    
    result = []
    for sub in subscriptions:
        days_remaining = (sub.end_date - today).days
        result.append(ExpiringSubscription(
            id=sub.id,
            member=MemberBasicInfo(
                id=sub.member.id,
                first_name=sub.member.first_name,
                last_name_paternal=sub.member.last_name_paternal,
                last_name_maternal=sub.member.last_name_maternal
            ),
            plan=PlanBasicInfo(
                id=sub.plan.id,
                name=sub.plan.name
            ),
            end_date=sub.end_date,
            days_remaining=days_remaining
        ))
    
    return result

def get_recent_checkins(db: Session, limit: int = 15) -> List[RecentCheckIn]:
    """Get recent check-ins with member info"""
    today = date.today()
    
    checkins = db.query(Attendance).join(
        Member, Attendance.member_id == Member.id
    ).join(
        Subscription, Attendance.subscription_id == Subscription.id
    ).order_by(Attendance.check_in_time.desc()).limit(limit).all()
    
    result = []
    for checkin in checkins:
        sub = checkin.subscription
        if sub.end_date < today:
            status = "expired"
        elif (sub.end_date - today).days <= 7:
            status = "expiring_soon"
        else:
            status = "active"
        
        result.append(RecentCheckIn(
            id=checkin.id,
            member=MemberBasicInfo(
                id=checkin.member.id,
                first_name=checkin.member.first_name,
                last_name_paternal=checkin.member.last_name_paternal,
                last_name_maternal=checkin.member.last_name_maternal
            ),
            check_in_time=checkin.check_in_time,
            subscription_status=status
        ))
    
    return result

def get_weekly_attendance_stats(db: Session, days: int = 7) -> List[DailyAttendanceStats]:
    """Get attendance statistics for the last X days"""
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    
    # Query attendance grouped by date
    stats = db.query(
        Attendance.date,
        func.count(Attendance.id).label('total_visits')
    ).filter(
        Attendance.date >= start_date
    ).group_by(Attendance.date).order_by(Attendance.date.asc()).all()
    
    # Create a dict for easy lookup
    stats_dict = {stat.date: stat.total_visits for stat in stats}
    
    # Generate list for all days (including days with 0 visits)
    result = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        day_name = SPANISH_DAYS[current_date.weekday()]
        
        result.append(DailyAttendanceStats(
            date=current_date.isoformat(),
            total_visits=stats_dict.get(current_date, 0),
            day_name=day_name
        ))
    
    return result

def get_payment_metrics(db: Session) -> PaymentMetrics:  # ← Cambiar de dict a PaymentMetrics
    """Get payment metrics for dashboard"""
    from payments.models import PaymentRecord
    from decimal import Decimal
    
    today = date.today()
    month_start = today.replace(day=1)
    
    # Ingresos de hoy
    today_payments = db.query(func.sum(PaymentRecord.amount)).filter(
        PaymentRecord.payment_date == today
    ).scalar() or Decimal("0.00")
    
    # Ingresos del mes
    month_payments = db.query(func.sum(PaymentRecord.amount)).filter(
        PaymentRecord.payment_date >= month_start
    ).scalar() or Decimal("0.00")
    
    # Pagos pendientes (suscripciones con deuda)
    pending_subs = db.query(Subscription).join(Plan).filter(
        and_(
            Subscription.status == "active",
            Subscription.payment_status.in_(["pending", "partial"])
        )
    ).all()
    
    pending_amount = sum(
        float(sub.plan.price) - float(sub.amount_paid) 
        for sub in pending_subs
    )
    
    return PaymentMetrics(  # ← Regresar PaymentMetrics en lugar de dict
        today_income=float(today_payments),
        month_income=float(month_payments),
        pending_payments=pending_amount
    )

def get_recent_payments(db: Session, limit: int = 5) -> List[RecentPayment]:  # ← Cambiar tipo de retorno
    """Get recent payments for dashboard"""
    from payments.models import PaymentRecord
    
    payments = db.query(PaymentRecord).join(
        Member, PaymentRecord.member_id == Member.id
    ).order_by(PaymentRecord.payment_date.desc()).limit(limit).all()
    
    result = []
    for p in payments:
        result.append(RecentPayment(  # ← Usar RecentPayment en lugar de dict
            id=p.id,
            member_name=f"{p.member.first_name} {p.member.last_name_paternal}",
            amount=float(p.amount),
            payment_method=p.payment_method,
            payment_date=p.payment_date.isoformat()
        ))
    
    return result

def get_weekly_income_stats(db: Session, days: int = 7) -> List[DailyIncomeStats]:  # ← Cambiar tipo de retorno
    """Get income statistics for the last X days"""
    from payments.models import PaymentRecord
    
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    
    # Query payments grouped by date
    stats = db.query(
        PaymentRecord.payment_date,
        func.sum(PaymentRecord.amount).label('total_income')
    ).filter(
        PaymentRecord.payment_date >= start_date
    ).group_by(PaymentRecord.payment_date).order_by(PaymentRecord.payment_date.asc()).all()
    
    # Create dict for easy lookup
    stats_dict = {stat.payment_date: float(stat.total_income) for stat in stats}
    
    # Generate list for all days
    result = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        day_name = SPANISH_DAYS[current_date.weekday()]
        
        result.append(DailyIncomeStats(  # ← Usar DailyIncomeStats en lugar de dict
            date=current_date.isoformat(),
            total_income=stats_dict.get(current_date, 0.0),
            day_name=day_name
        ))
    
    return result

def get_plan_metrics(db: Session) -> List[dict]:
    """Get plan popularity metrics"""
    from sqlalchemy import func
    
    # Count active subscriptions per plan
    plan_stats = db.query(
        Plan.id,
        Plan.name,
        func.count(Subscription.id).label('active_count')
    ).outerjoin(
        Subscription,
        and_(
            Subscription.plan_id == Plan.id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).group_by(Plan.id, Plan.name).order_by(func.count(Subscription.id).desc()).all()
    
    return [{
        'plan_id': stat.id,
        'plan_name': stat.name,
        'active_subscriptions': stat.active_count
    } for stat in plan_stats]