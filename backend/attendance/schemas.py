from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

#Base schema
class AttendanceBase(BaseModel):
    member_id: int = Field(..., gt=0)
    notes: Optional[str] = None
    
#Schema for check-in (create attendance)
class AttendanceCheckIn(AttendanceBase):
    pass

#Schema for check-out (update attendance)
class AttendanceCheckOut(BaseModel):
    notes: Optional[str] = None

# Schema for new member
class MemberInfo(BaseModel):
    first_name: str
    last_name_paternal: str
    last_name_maternal: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for response (API returns)
class AttendanceResponse(AttendanceBase):
    id: int
    subscription_id: Optional[int] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    date: date
    duration_minutes: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Schema with member data (for lists)
class AttendanceWithMemberResponse(AttendanceResponse):
    member: MemberInfo
    
    class Config:
        from_attributes = True
        
# Schema for statistics
class AttendanceStats(BaseModel):
    total_visits: int
    unique_members: int
    average_duration_minutes: Optional[float] = None
    current_members_in_gym: int