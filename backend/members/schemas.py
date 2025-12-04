from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class MemberBase(BaseModel):
    first_name: str
    last_name_paternal: str
    last_name_maternal: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
class MemberCreate(MemberBase):
    pass

class MemberUpdate(MemberBase):
    first_name: Optional[str] = None
    last_name_paternal: Optional[str] = None
    last_name_maternal: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    
class MemberResponse(MemberBase):
    id: int
    registration_date: date
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True