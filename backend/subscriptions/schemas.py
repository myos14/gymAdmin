from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

# Plan schema (para responses anidados)
class PlanBase(BaseModel):
    id: int
    name: str
    price: Decimal
    duration_days: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    member_id: int = Field(..., gt=0)
    plan_id: int = Field(..., gt=0)
    start_date: date
    payment_status: str = Field(default="pending", pattern="^(pending|paid|partial)$")
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    @field_validator('start_date')
    @classmethod
    def validate_start_date(cls, v):
        if v < date.today():
            raise ValueError('La fecha de inicio no puede ser anterior a hoy')
        return v

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|expired|cancelled)$")
    payment_status: Optional[str] = Field(None, pattern="^(pending|paid|partial)$")
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    end_date: date
    status: str
    created_at: datetime
    plan: PlanBase

    class Config:
        from_attributes = True