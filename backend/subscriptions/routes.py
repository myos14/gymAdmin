from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, timedelta
from pydantic import BaseModel
from decimal import Decimal

from database import get_db
from subscriptions.models import Subscription
from members.models import Member
from plans.models import Plan
from payments.models import PaymentRecord
from subscriptions.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse
from users.auth import get_current_active_user, require_admin
from users.models import User

class SubscriptionRenew(BaseModel):
    plan_id: Optional[int] = None
    start_date: Optional[date] = None
    payment_status: Optional[str] = "pending"
    amount_paid: Optional[float] = 0.0
    notes: Optional[str] = None

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

def calculate_end_date(start_date: date, duration_days: int) -> date:
    """Calcular fecha de fin, manejando planes permanentes"""
    if duration_days == 0:
        return start_date + timedelta(days=36500)
    return start_date + timedelta(days=duration_days)

def update_subscription_status(subscription: Subscription):
    """Update subscription status if expired"""
    if subscription.end_date < date.today() and subscription.status == "active":
        subscription.status = "expired"

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
def create_subscription(subscription: SubscriptionCreate, db: Session = Depends(get_db)):
    member = db.query(Member).filter(Member.id == subscription.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    active_sub = db.query(Subscription).filter(
        and_(
            Subscription.member_id == subscription.member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).first()
    
    if active_sub:
        raise HTTPException(
            status_code=400, 
            detail=f"El miembro ya tiene una suscripción activa que vence el {active_sub.end_date}"
        )
    
    if plan.duration_days == 0:
        end_date = subscription.start_date + timedelta(days=36500)
    else:
        end_date = calculate_end_date(subscription.start_date, plan.duration_days)
    
    subscription_data = subscription.model_dump(exclude={'payment_method'})
    
    db_subscription = Subscription(
        **subscription_data,
        plan_price=plan.price,
        end_date=end_date,
        status="active"
    )
    
    db.add(db_subscription)
    db.flush()
    
    payment_amount = subscription.amount_paid if subscription.amount_paid > 0 else plan.price
    
    method_map = {
        'cash': 'efectivo',
        'card': 'tarjeta',
        'transfer': 'transferencia',
        'other': 'otro'
    }
    
    payment_method_db = method_map.get(subscription.payment_method, 'efectivo')
    
    db_payment = PaymentRecord(
        subscription_id=db_subscription.id,
        member_id=subscription.member_id,
        amount=Decimal(str(payment_amount)),
        payment_date=subscription.start_date,
        payment_method=payment_method_db,
        notes=subscription.notes or f"Pago automático al crear suscripción {plan.name}"
    )
    
    db.add(db_payment)
    db_subscription.amount_paid = payment_amount
    db_subscription.payment_status = "paid"
    
    db.commit()
    db.refresh(db_subscription)
    
    return db_subscription

@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse)
def renew_subscription(
    subscription_id: int,
    renew_data: SubscriptionRenew = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Renovar suscripción (requiere autenticación)"""
    old_subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not old_subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    plan_id = renew_data.plan_id if renew_data.plan_id else old_subscription.plan_id
    
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    active_sub = db.query(Subscription).filter(
        and_(
            Subscription.member_id == old_subscription.member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today(),
            Subscription.id != subscription_id
        )
    ).first()
    
    if active_sub:
        raise HTTPException(
            status_code=400,
            detail=f"El miembro ya tiene otra suscripción activa que vence el {active_sub.end_date}"
        )
    
    if renew_data.start_date:
        new_start_date = renew_data.start_date
    else:
        if old_subscription.end_date >= date.today():
            new_start_date = old_subscription.end_date + timedelta(days=1)
        else:
            new_start_date = date.today()
    
    new_end_date = calculate_end_date(new_start_date, plan.duration_days)
    
    new_subscription = Subscription(
        member_id=old_subscription.member_id,
        plan_id=plan_id,
        plan_price=plan.price,
        start_date=new_start_date,
        end_date=new_end_date,
        status="active",
        payment_status=renew_data.payment_status or "pending",
        amount_paid=renew_data.amount_paid or 0.0,
        notes=renew_data.notes
    )
    
    old_subscription.status = "expired"
    
    db.add(new_subscription)
    db.flush()
    
    payment_amount = renew_data.amount_paid if renew_data.amount_paid and renew_data.amount_paid > 0 else plan.price
    
    db_payment = PaymentRecord(
        subscription_id=new_subscription.id,
        member_id=old_subscription.member_id,
        amount=Decimal(str(payment_amount)),
        payment_date=new_start_date,
        payment_method="efectivo",
        notes=f"Pago automático al renovar suscripción {plan.name}"
    )
    
    db.add(db_payment)
    
    new_subscription.amount_paid = payment_amount
    new_subscription.payment_status = "paid"
    
    db.commit()
    db.refresh(new_subscription)
    
    return new_subscription

@router.get("/")
def get_subscriptions(
    status: Optional[str] = Query(None, pattern="^(active|expired|cancelled)$"),
    member_id: Optional[int] = None,
    search: Optional[str] = None,  # ← AGREGADO
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Obtener lista de suscripciones con paginación"""
    query = db.query(Subscription).options(
        joinedload(Subscription.member),
        joinedload(Subscription.plan)
    )
    
    if status:
        query = query.filter(Subscription.status == status)
    if member_id:
        query = query.filter(Subscription.member_id == member_id)
    
    # ← BÚSQUEDA AGREGADA
    if search:
        search_pattern = f"%{search}%"
        query = query.join(Member).join(Plan).filter(
            (Member.first_name.ilike(search_pattern)) |
            (Member.last_name_paternal.ilike(search_pattern)) |
            (Plan.name.ilike(search_pattern))
        )
    
    total = query.count()
    
    subscriptions = query.order_by(Subscription.created_at.desc()).offset(skip).limit(limit).all()
    
    for sub in subscriptions:
        update_subscription_status(sub)
    
    db.commit()
    
    # ← SERIALIZACIÓN MANUAL PARA QUE FUNCIONE
    subscriptions_data = []
    for sub in subscriptions:
        subscriptions_data.append({
            "id": sub.id,
            "member_id": sub.member_id,
            "plan_id": sub.plan_id,
            "plan_price": float(sub.plan_price),
            "start_date": sub.start_date.isoformat(),
            "end_date": sub.end_date.isoformat(),
            "status": sub.status,
            "payment_status": sub.payment_status,
            "amount_paid": float(sub.amount_paid) if sub.amount_paid else 0.0,
            "notes": sub.notes,
            "created_at": sub.created_at.isoformat(),
            "member": {
                "id": sub.member.id,
                "first_name": sub.member.first_name,
                "last_name_paternal": sub.member.last_name_paternal,
                "last_name_maternal": sub.member.last_name_maternal
            } if sub.member else None,
            "plan": {
                "id": sub.plan.id,
                "name": sub.plan.name,
                "price": float(sub.plan.price),
                "duration_days": sub.plan.duration_days,
                "description": sub.plan.description
            } if sub.plan else None
        })
    
    return {
        "subscriptions": subscriptions_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }
    
@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener suscripción por ID (requiere autenticación)"""
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    update_subscription_status(subscription)
    db.commit()
    
    return subscription

@router.put("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: int,
    subscription_update: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Actualizar suscripción (solo admin)"""
    db_subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    update_data = subscription_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_subscription, field, value)
    
    db.commit()
    db.refresh(db_subscription)
    
    return db_subscription

@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Eliminar suscripción (solo admin)"""
    db_subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    db.delete(db_subscription)
    db.commit()
    
    return None

@router.get("/member/{member_id}/active", response_model=Optional[SubscriptionResponse])
def get_member_active_subscription(
    member_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener suscripción activa de un miembro (requiere autenticación)"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    subscription = db.query(Subscription).filter(
        and_(
            Subscription.member_id == member_id,
            Subscription.status == "active",
            Subscription.end_date >= date.today()
        )
    ).first()
    
    if subscription:
        update_subscription_status(subscription)
        db.commit()
    
    return subscription