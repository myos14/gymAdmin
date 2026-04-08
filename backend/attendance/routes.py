import os
from attendance.qr_service import generate_member_qr_token, validate_member_qr_token
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from database import get_db
from attendance.models import Attendance
from members.models import Member
from subscriptions.models import Subscription
from attendance.schemas import(
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceResponse,
    AttendanceWithMemberResponse,
    AttendanceStats
)

MX = ZoneInfo("America/Mexico_City")
router = APIRouter(prefix="/attendance", tags=["attendance"])

def _auto_checkout_expired(db: Session, hours_limit: int = 4):
    """Helper: Auto-checkout de sesiones expiradas"""
    time_limit = datetime.now(MX) - timedelta(hours=hours_limit)
    
    expired = db.query(Attendance).filter(
        and_(
            Attendance.check_out_time.is_(None),
            Attendance.check_in_time <= time_limit
        )
    ).all()
    
    for session in expired:
        check_in = session.check_in_time
        if check_in.tzinfo is None:
            check_in = check_in.replace(tzinfo=MX)
        session.check_out_time = check_in + timedelta(hours=hours_limit)
        session.duration_minutes = hours_limit * 60
        if session.notes:
            session.notes += f" [Auto-checkout {hours_limit}h]"
        else:
            session.notes = f"Auto-checkout {hours_limit}h"
    
    if expired:
        db.commit()
    
    return len(expired)

@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(attendance: AttendanceCheckIn, db: Session = Depends(get_db)):
    """Registrar entrada de un miembro"""
    
    _auto_checkout_expired(db, hours_limit=4)
    
    member = db.query(Member).filter(Member.id == attendance.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    if not member.is_active:
        raise HTTPException(status_code=400, detail="Miembro no activo")
    
    active_subscription = db.query(Subscription).filter(
        and_(
            Subscription.member_id == attendance.member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).first()
    
    if not active_subscription:
        raise HTTPException(
            status_code=400,
            detail="El miembro no tiene una suscripción activa. No puede ingresar."
        )
    
    today = date.today()
    existing_checkin = db.query(Attendance).filter(
        and_(
            Attendance.member_id == attendance.member_id,
            Attendance.date == today,
            Attendance.check_out_time.is_(None)
        )
    ).first()
    
    if existing_checkin:
        check_in_local = existing_checkin.check_in_time
        if check_in_local.tzinfo is not None:
            check_in_local = check_in_local.astimezone(MX)
        raise HTTPException(
            status_code=400,
            detail=f"El miembro ya tiene un check-in activo hoy a las {check_in_local.strftime('%H:%M')}"
        )
    
    db_attendance = Attendance(
        member_id=attendance.member_id,
        subscription_id=active_subscription.id,
        notes=attendance.notes
    )
    
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance

@router.put("/{attendance_id}/check-out", response_model=AttendanceResponse)
def check_out(
    attendance_id: int,
    checkout_data: AttendanceCheckOut,
    db: Session = Depends(get_db)
):
    """Registrar salida de un miembro"""
    
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Registro de asistencia no encontrada")
    
    if db_attendance.check_out_time is not None:
        checkout_local = db_attendance.check_out_time.astimezone(MX)
        raise HTTPException(
            status_code=400,
            detail=f"Este registro ya tiene check-out a las {checkout_local.strftime('%H:%M')}"
        )
    
    now = datetime.now(MX)
    db_attendance.check_out_time = now
    
    check_in = db_attendance.check_in_time
    if check_in.tzinfo is None:
        check_in = check_in.replace(tzinfo=MX)
    duration = now - check_in
    db_attendance.duration_minutes = int(duration.total_seconds() / 60)
    
    if checkout_data.notes:
        db_attendance.notes = checkout_data.notes
    
    db.commit()
    db.refresh(db_attendance)
    
    return db_attendance

@router.get("/", response_model=List[AttendanceResponse])
def get_attendances(
    member_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    only_active: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar asistencias con filtros opcionales"""
    query = db.query(Attendance)
    
    if member_id:
        query = query.filter(Attendance.member_id == member_id)
    if start_date:
        query = query.filter(Attendance.date >= start_date)
    if end_date:
        query = query.filter(Attendance.date <= end_date)
    if only_active:
        query = query.filter(Attendance.check_out_time.is_(None))
        
    attendances = query.order_by(Attendance.check_in_time.desc()).offset(skip).limit(limit).all()
    
    return attendances

@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Obtener un registro de asistencia específico"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    if not attendance:
        raise HTTPException(status_code=404, detail="Registro de asistencia no encontrada")
    
    return attendance

@router.get("/member/{member_id}/history", response_model=List[AttendanceResponse])
def get_member_attendance_history(
    member_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Obtener el historial de asistencias de un miembro"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    start_date = date.today() - timedelta(days=days)
    
    attendances = db.query(Attendance).filter(
        and_(
            Attendance.member_id == member_id,
            Attendance.date >= start_date
        )
    ).order_by(Attendance.date.desc()).all()
    
    return attendances

@router.get("/current/in-gym", response_model=List[AttendanceWithMemberResponse])
def get_current_members_in_gym(db: Session = Depends(get_db)):
    """Obtener lista de miembros actualmente en el gym (sin check-out)"""
    today = date.today()
    
    attendances = db.query(Attendance).filter(
        and_(
            Attendance.date == today,
            Attendance.check_out_time.is_(None)
        )
    ).order_by(Attendance.check_in_time.desc()).all()
    
    return attendances

@router.get("/stats/daily", response_model=AttendanceStats)
def get_daily_stats(
    target_date: date = Query(default_factory=date.today),
    db: Session = Depends(get_db)
):
    """Obtener el resumen de asistencias de un día específico"""
    
    attendances = db.query(Attendance).filter(Attendance.date == target_date).all()
    
    total_visits = len(attendances)
    unique_members = len(set(a.member_id for a in attendances))
    
    completed_visits = [a for a in attendances if a.duration_minutes is not None]
    avg_duration = None
    if completed_visits:
        avg_duration = sum(a.duration_minutes for a in completed_visits) / len(completed_visits)
    
    current_in_gym = 0
    if target_date == date.today():
        current_in_gym = db.query(Attendance).filter(
            and_(
                Attendance.date == target_date,
                Attendance.check_out_time.is_(None)
            )
        ).count()
        
    return AttendanceStats(
        total_visits=total_visits,
        unique_members=unique_members,
        average_duration_minutes=avg_duration,
        current_members_in_gym=current_in_gym
    )

@router.post("/auto-checkout", status_code=status.HTTP_200_OK)
def manual_auto_checkout(db: Session = Depends(get_db)):
    """Ejecutar auto-checkout manualmente"""
    count = _auto_checkout_expired(db, hours_limit=4)
    return {
        "message": "Auto-checkout ejecutado",
        "sessions_closed": count
    }
    
@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Eliminar una asistencia"""
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    
    db.delete(db_attendance)
    db.commit()
    
    return None

@router.get("/member/{member_id}/qr-token")
def get_member_qr_token(member_id: int, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    if not member.is_active:
        raise HTTPException(status_code=400, detail="Miembro inactivo")

    active_subscription = db.query(Subscription).filter(
        and_(
            Subscription.member_id == member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).first()

    if not active_subscription:
        raise HTTPException(status_code=400, detail="Sin suscripción activa")

    token = generate_member_qr_token(member_id)
    base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    return {
        "token": token,
        "qr_url": f"{base_url}/member-qr/{token}",
        "member_id": member_id,
        "member_name": f"{member.first_name} {member.last_name_paternal}"
    }

@router.post("/qr-checkin")
def qr_checkin(token: str, db: Session = Depends(get_db)):
    try:
        member_id = validate_member_qr_token(token)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    if not member.is_active:
        raise HTTPException(status_code=400, detail="Miembro inactivo")

    active_subscription = db.query(Subscription).filter(
        and_(
            Subscription.member_id == member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).first()

    if not active_subscription:
        raise HTTPException(status_code=400, detail="Sin suscripción activa. No puede ingresar.")

    _auto_checkout_expired(db, hours_limit=4)

    today = date.today()
    existing = db.query(Attendance).filter(
        and_(
            Attendance.member_id == member_id,
            Attendance.date == today,
            Attendance.check_out_time.is_(None)
        )
    ).first()

    if existing:
        check_in_local = existing.check_in_time.astimezone(MX)
        raise HTTPException(
            status_code=400,
            detail=f"Ya tiene entrada activa desde las {check_in_local.strftime('%H:%M')}"
        )

    db_attendance = Attendance(
        member_id=member_id,
        subscription_id=active_subscription.id,
        notes="Check-in por QR"
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)

    days_remaining = (active_subscription.end_date - today).days
    check_in_local = db_attendance.check_in_time.astimezone(MX)

    return {
        "success": True,
        "attendance_id": db_attendance.id,
        "member_id": member_id,
        "member_name": f"{member.first_name} {member.last_name_paternal}"
                        + (f" {member.last_name_maternal}" if member.last_name_maternal else ""),
        "check_in_time": check_in_local.strftime("%H:%M"),
        "subscription": {
            "plan_name": active_subscription.plan.name if active_subscription.plan else "Plan",
            "end_date": active_subscription.end_date.strftime("%d/%m/%Y"),
            "days_remaining": days_remaining,
            "alert": "warning" if days_remaining <= 5 else "ok"
        }
    }