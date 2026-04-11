from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from database import get_db
from datetime import datetime, timedelta, date
from typing import Literal
from decimal import Decimal

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/summary")
def get_reports_summary(
    period: Literal['week', 'month', 'year'] = Query('month'),
    db: Session = Depends(get_db)
):
    """Obtener resumen de reportes para el periodo seleccionado"""
    
    today = date.today()
    if period == 'week':
        start_date = today - timedelta(days=7)
    elif period == 'month':
        start_date = today - timedelta(days=30)
    else:
        start_date = today - timedelta(days=365)
    
    from payments.models import PaymentRecord
    from plans.models import Plan
    from members.models import Member
    from attendance.models import Attendance
    from subscriptions.models import Subscription
    
    # Earnings
    income_by_plan = db.query(
        Plan.name.label('plan_name'),
        func.count(PaymentRecord.id).label('count'),
        func.sum(PaymentRecord.amount).label('total'),
        func.avg(PaymentRecord.amount).label('average')
    ).join(
        Subscription, PaymentRecord.subscription_id == Subscription.id
    ).join(
        Plan, Subscription.plan_id == Plan.id
    ).filter(
        PaymentRecord.payment_date >= start_date,
        PaymentRecord.payment_date <= today
    ).group_by(Plan.name).order_by(desc('total')).all()
    
    # Total income
    total_income = sum(item.total for item in income_by_plan) if income_by_plan else Decimal(0)
    payment_count = db.query(PaymentRecord).filter(
        PaymentRecord.payment_date >= start_date,
        PaymentRecord.payment_date <= today
    ).count()
    
    new_members_count = db.query(Member).filter(
        Member.registration_date >= start_date,
        Member.registration_date <= today
    ).count()
    
    # attendance
    total_attendance = db.query(Attendance).filter(
        Attendance.date >= start_date,
        Attendance.date <= today
    ).count()
    
    days_in_period = (today - start_date).days
    daily_avg = round(total_attendance / days_in_period, 1) if days_in_period > 0 else 0
    
    # Top active members
    top_members = db.query(
        Member.id,
        Member.first_name,
        Member.last_name_paternal,
        func.count(Attendance.id).label('visit_count')
    ).join(
        Attendance, Attendance.member_id == Member.id
    ).filter(
        Attendance.date >= start_date,
        Attendance.date <= today
    ).group_by(
        Member.id,
        Member.first_name,
        Member.last_name_paternal
    ).order_by(
        desc('visit_count')
    ).limit(10).all()
    
    # Retention
    total_members = db.query(Member).count()
    
    active_members = db.query(Member).join(
        Subscription, Member.id == Subscription.member_id
    ).filter(
        Subscription.status == 'active',
        Subscription.end_date >= today
    ).distinct().count()
    
    # Inactive members
    inactive_members = total_members - active_members
    
    #  Rate of retention
    retention_rate = round((active_members / total_members * 100), 1) if total_members > 0 else 0
    
    # Subscriptions that expired in the period
    expired_in_period = db.query(Subscription).filter(
        Subscription.end_date >= start_date,
        Subscription.end_date < today,
        Subscription.status == 'expired'
    ).count()
    
    # Members that renewed (have an active subscription after having an expired in the period)
    renewed_members = db.query(func.count(func.distinct(Member.id))).select_from(Member).join(
        Subscription, Member.id == Subscription.member_id
    ).filter(
        Member.id.in_(
            db.query(Subscription.member_id).filter(
                Subscription.end_date >= start_date,
                Subscription.end_date < today,
                Subscription.status == 'expired'
            )
        ),
        Subscription.status == 'active',
        Subscription.start_date >= start_date
    ).scalar()
    
    renewal_rate = round((renewed_members / expired_in_period * 100), 1) if expired_in_period > 0 else 0
    
    # Plan metrics 
    plan_metrics = db.query(
        Plan.id.label('plan_id'),
        Plan.name.label('plan_name'),
        func.count(Subscription.id).label('active_subscriptions')
    ).join(
        Subscription, Plan.id == Subscription.plan_id
    ).filter(
        Subscription.status == 'active',
        Subscription.end_date >= today
    ).group_by(Plan.id, Plan.name).order_by(desc('active_subscriptions')).all()

    # Recent checkins
    recent_checkins = db.query(
        Attendance.id,
        Attendance.check_in_time,
        Member.first_name,
        Member.last_name_paternal,
        Member.last_name_maternal,
        case(
            (
                db.query(Subscription).filter(
                    Subscription.member_id == Member.id,
                    Subscription.status == 'active',
                    Subscription.end_date >= today
                ).exists(), 'active'
            ),
            (
                db.query(Subscription).filter(
                    Subscription.member_id == Member.id,
                    Subscription.status == 'active',
                    Subscription.end_date >= today,
                    Subscription.end_date <= today + timedelta(days=7)
                ).exists(), 'expiring_soon'
            ),
            else_='expired'
        ).label('subscription_status')
    ).join(
        Member, Attendance.member_id == Member.id
    ).order_by(desc(Attendance.check_in_time)).limit(20).all()
    
    # Hourly distribution by gender
    hourly_gender_raw = db.query(
        func.extract('hour', Attendance.check_in_time).label('hour'),
        Member.gender,
        func.count(Attendance.id).label('count')
    ).join(
        Member, Attendance.member_id == Member.id
    ).filter(
        Attendance.date >= start_date,
        Attendance.date <= today
    ).group_by(
        func.extract('hour', Attendance.check_in_time),
        Member.gender
    ).order_by('hour').all()

    # Build hourly map with gender breakdown
    hourly_gender_map = {}
    for r in hourly_gender_raw:
        h = int(r.hour)
        if h not in hourly_gender_map:
            hourly_gender_map[h] = {'masculino': 0, 'femenino': 0, 'otro': 0}
        g = (r.gender or '').lower()
        if g in ('masculino', 'm', 'hombre'):
            hourly_gender_map[h]['masculino'] += r.count
        elif g in ('femenino', 'f', 'mujer'):
            hourly_gender_map[h]['femenino'] += r.count
        else:
            hourly_gender_map[h]['otro'] += r.count

    hourly_distribution = [
        {
            "hour": h,
            "count": sum(hourly_gender_map.get(h, {}).values()),
            "masculino": hourly_gender_map.get(h, {}).get('masculino', 0),
            "femenino":  hourly_gender_map.get(h, {}).get('femenino',  0),
            "otro":      hourly_gender_map.get(h, {}).get('otro',      0),
        }
        for h in range(24)
    ]

    return {
        "plan_metrics": [
            {
                "plan_id": p.plan_id,
                "plan_name": p.plan_name,
                "active_subscriptions": p.active_subscriptions
            }
            for p in plan_metrics
        ],
        "recent_checkins": [
            {
                "id": c.id,
                "check_in_time": c.check_in_time.isoformat(),
                "subscription_status": c.subscription_status,
                "member": {
                    "first_name": c.first_name,
                    "last_name_paternal": c.last_name_paternal,
                    "last_name_maternal": c.last_name_maternal
                }
            }
            for c in recent_checkins
        ],
        "period": period,
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "income": {
            "total": float(total_income),
            "payment_count": payment_count,
            "by_plan": [
                {
                    "plan_name": item.plan_name,
                    "count": item.count,
                    "total": float(item.total),
                    "average": float(item.average)
                }
                for item in income_by_plan
            ]
        },
        "members": {
            "new_count": new_members_count
        },
        "attendance": {
            "total": total_attendance,
            "daily_avg": daily_avg,
            "hourly_distribution": hourly_distribution,
            "top_members": [
                {
                    "id": m.id,
                    "full_name": f"{m.first_name} {m.last_name_paternal}",
                    "visit_count": m.visit_count
                }
                for m in top_members
            ]
        },
        "retention": {
            "total_members": total_members,
            "active_members": active_members,
            "inactive_members": inactive_members,
            "retention_rate": retention_rate,
            "renewal_rate": renewal_rate,
            "expired_in_period": expired_in_period,
            "renewed_count": renewed_members
        }
    }