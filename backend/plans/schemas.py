from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    duration_days: int = Field(..., ge=0)
    description: Optional[str] = None
    
class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    duration_days: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
class PlanResponse(PlanBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True
