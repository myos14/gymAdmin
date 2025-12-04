from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import date, datetime, timedelta

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

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(attendance: AttendanceCheckIn, db: Session = Depends(get_db)):
    """Registrar entrada de un miembro"""
    
    #Verify member exists
    member = db.query(Member).filter(Member.id == attendance.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    #Check if member is active
    if not member.is_active:
        raise HTTPException(status_code=400, detail="Miembro no activo")
    
    #Get active subscription
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
        
    #Checm if already checked in today (without checkout)
    today = date.today()
    existing_checkin = db.query(Attendance).filter(
        and_(
            Attendance.member_id == attendance.member_id,
            Attendance.date == today,
            Attendance.check_out_time.is_(None) # Sin check-out
        )
    ).first()
    
    if existing_checkin:
        raise HTTPException(
            status_code=400,
            detail=f"El miembro ya tiene un check-in activo hoy a las {existing_checkin.check_in_time.strftime('%H: %M')}"
        )
        
    #Create attendance record
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
        raise HTTPException(
            status_code=400, 
            detail=f"Este registro ya tiene check-out a las {db_attendance.check_out_time.strftime('%H:%M')}"
        )
        
    #Set check-out time
    now = datetime.now()
    db_attendance.check_out_time = now
    
    #Calculate duration in minutes
    duration = now - db_attendance.check_in_time
    db_attendance.duration_minutes = int(duration.total_seconds() / 60)
    
    #Update notes if provided
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
    only_active: bool = False, #solo check-ins sin check-out
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
        query = query. filter(Attendance.check_out_time.is_(None))
        
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
    db:Session = Depends(get_db)
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
    
    #Calculate average duration (only for completed visits)
    completed_visits = [a for a in attendances if a.duration_minutes is not None]
    avg_duration = None
    if completed_visits:
        avg_duration = sum(a.duration_minutes for a in completed_visits) / len(completed_visits)
    
    #Count current members in gym (if target_date is today)
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
    
@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    """Eliminar una asistencia"""
    db_attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")
    
    db.delete(db_attendance)
    db.commit()
    
    return None