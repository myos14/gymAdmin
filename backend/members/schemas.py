from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional

class MemberBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name_paternal: str = Field(..., min_length=1, max_length=50)
    last_name_maternal: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=20)
    
class MemberCreate(MemberBase):
    pass

class MemberUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name_paternal: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name_maternal: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=20)
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