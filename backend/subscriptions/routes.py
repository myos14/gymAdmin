from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, timedelta

from database import get_db
from subscriptions.models import Subscription
from members.models import Member
from plans.models import Plan
from subscriptions.schemas import SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

def calculate_end_date(start_date: date, duration_days: int) -> date:
    return start_date + timedelta(days=duration_days)

def update_subscription_status(subscription: Subscription):
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
    
    end_date = calculate_end_date(subscription.start_date, plan.duration_days)
    
    db_subscription = Subscription(
        **subscription.model_dump(),
        end_date=end_date,
        status="active"
    )
    
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    
    return db_subscription

@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    status: Optional[str] = Query(None, pattern="^(active|expired|cancelled)$"),
    member_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Subscription)
    
    if status:
        query = query.filter(Subscription.status == status)
    if member_id:
        query = query.filter(Subscription.member_id == member_id)
    
    subscriptions = query.offset(skip).limit(limit).all()
    
    for sub in subscriptions:
        update_subscription_status(sub)
    
    db.commit()
    return subscriptions

@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db)
):
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
def delete_subscription(subscription_id: int, db: Session = Depends(get_db)):
    db_subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    db.delete(db_subscription)
    db.commit()
    
    return None

@router.get("/member/{member_id}/active", response_model=Optional[SubscriptionResponse])
def get_member_active_subscription(member_id: int, db: Session = Depends(get_db)):
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