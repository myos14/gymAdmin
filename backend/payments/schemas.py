from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

class PaymentRecordBase(BaseModel):
    subscription_id: int = Field(..., gt=0)
    member_id: int = Field(..., gt=0)
    amount: Decimal = Field(..., gt=0)
    payment_date: date = Field(default_factory=date.today)
    payment_method: str = Field(..., pattern="^(efectivo|tarjeta|transferencia|otro)$")
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    
class PaymentRecordCreate(PaymentRecordBase):
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('El monto debe ser mayor a 0')
        return v

class PaymentRecordUpdate(BaseModel):
    payment_method: Optional[str] = Field(None, pattern="^(efectivo|tarjeta|transferencia|otro)$")
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    
class PaymentRecordResponse(PaymentRecordBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
        
# Payment schemas
class PaymentSummary(BaseModel):
    total_amount: Decimal
    payment_count: int
    payment_method_breakdown: dict
    