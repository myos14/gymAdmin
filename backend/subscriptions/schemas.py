from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

# Schemas for nested responses
class PlanBase(BaseModel):
    id: int
    name: str
    price: Decimal
    duration_days: int
    description: Optional[str] = None

    class Config:
        from_attributes = True

class MemberBase(BaseModel):
    id: int
    first_name: str
    last_name_paternal: str
    last_name_maternal: Optional[str] = None
    
    class Config:
        from_attributes = True

# Subscription schemas
class SubscriptionBase(BaseModel):
    member_id: int = Field(..., gt=0)
    plan_id: int = Field(..., gt=0)
    start_date: date
    payment_status: str = Field(default="pending", pattern="^(pending|paid|partial)$")
    payment_method: str = Field(default="cash", pattern="^(cash|card|transfer|other)$")
    amount_paid: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|expired|cancelled)$")
    payment_status: Optional[str] = Field(None, pattern="^(pending|paid|partial)$")
    payment_method: Optional[str] = Field(None, pattern="^(cash|card|transfer|other)$")
    amount_paid: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None

class SubscriptionResponse(SubscriptionBase):
    id: int
    plan_price: Decimal
    end_date: date
    status: str
    created_at: datetime
    plan: PlanBase
    member: MemberBase

    class Config:
        from_attributes = True