from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, timedelta
from decimal import Decimal

from database import get_db
from payments.models import PaymentRecord
from subscriptions.models import Subscription
from members.models import Member
from payments.schemas import PaymentRecordCreate, PaymentRecordUpdate, PaymentRecordResponse, PaymentSummary

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/", response_model=PaymentRecordResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payment: PaymentRecordCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo pago"""
    
    #Verify member exists
    member= db.query(Member).filter(Member.id == payment.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    #Verify subscription exists
    subscription = db.query(Subscription).filter(Subscription.id == payment.subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    
    #Verify susbscription belongs to member
    if subscription.member_id != payment.member_id:
        raise HTTPException(status_code=400, detail="Suscripción no pertenece al miembro")
    
    #create payment record
    db_payment = PaymentRecord(**payment.model_dump())
    
    db.add(db_payment)
    
    #update subscription payment info
    total_paid = db.query(func.sum(PaymentRecord.amount)).filter(
        PaymentRecord.subscription_id == payment.subscription_id
    ).scalar() or Decimal("0.00")
    
    total_paid += payment.amount
    subscription.amount_paid = total_paid
    
    #update payment status
    if total_paid >= subscription.plan.price:
        subscription.payment_status = "paid"
    elif total_paid > 0:
        subscription.payment_status = "partial"
        
    db.commit()
    db.refresh(db_payment)
    
    return db_payment
    
@router.get("/", response_model=List[PaymentRecordResponse])
def get_payments(
    member_id: Optional[int] = None,
    subscription_id: Optional[int] = None,
    payment_method: Optional[str] = Query(None, pattern="^(efectivo|tarjeta|transferencia|otro)$"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar pagos con filtros opcionales"""
    query = db.query(PaymentRecord)
    
    if member_id:
        query = query.filter(PaymentRecord.member_id == member_id)
    if subscription_id:
        query = query.filter(PaymentRecord.subscription_id == subscription_id)
    if payment_method:
        query = query.filter(PaymentRecord.payment_method == payment_method)
    if start_date:
        query = query.filter(PaymentRecord.payment_date >= start_date)
    if end_date:
        query = query.filter(PaymentRecord.payment_date <= end_date)
        
    payments = query.order_by(PaymentRecord.payment_date.desc()).offset(skip).limit(limit).all()
    
    return payments

@router.get("/{payment_id}", response_model=PaymentRecordResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Obtener un pago específico"""
    payment = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    return payment

@router.put("/{payment_id}", response_model=PaymentRecordResponse)
def update_payment(
    payment_id: int,
    payment_update: PaymentRecordUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar información de un pago"""
    db_payment = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    
    if not db_payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    update_data = payment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)
        
    db.commit()
    db.refresh(db_payment)
    
    return db_payment

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    """Eliminar un pago"""
    db_payment = db.query(PaymentRecord).filter(PaymentRecord.id == payment_id).first()
    
    if not db_payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    db.delete(db_payment)
    
    #recalculate subscription payment status
    subscription = db.query(Subscription).filter(Subscription.id == db_payment.subscription_id).first()
    if subscription:
        total_paid = db.query(func.sum(PaymentRecord.amount)).filter(
            PaymentRecord.subscription_id == db_payment.subscription_id
        ).scalar() or Decimal("0.00")
        
        subscription.amount_paid = total_paid
        
        if total_paid >= subscription.plan.price:
            subscription.payment_status = "paid"
        elif total_paid > 0:
            subscription.payment_status = "partial"
        else:
            subscription.payment_status = "pending"
            
        db.commit()
        
        return None
    
@router.get("/member/{member_id}/history", response_model=List[PaymentRecordResponse])
def get_member_payment_history(member_id: int, db: Session = Depends(get_db)):
    """Obtener el historial de pagos de un miembro"""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    
    payments = db.query(PaymentRecord).filter(
        PaymentRecord.member_id == member_id
    ).order_by(PaymentRecord.payment_date.desc()).all()
    
    return payments

@router.get("/summary/total", response_model=PaymentSummary)
def get_payment_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Obtener el resumen de pagos"""
    query = db.query(PaymentRecord)
    
    if start_date:
        query = query.filter(PaymentRecord.payment_date >= start_date)
    if end_date:
        query = query.filter(PaymentRecord.payment_date <= end_date)
        
    payments = query.all()
    
    total_amount = sum(p.amount for p in payments)
    payment_count =len(payments)
    
    #breakdown by payment method
    method_breakdown = {}
    for payment in payments:
        method = payment.payment_method
        method_breakdown[method] = method_breakdown.get(method, Decimal("0.00")) + payment.amount
        
    return PaymentSummary(
        total_amount=total_amount,
        payment_count=payment_count,
        payment_method_breakdown={k: str(v) for k, v in method_breakdown.items()}
    )