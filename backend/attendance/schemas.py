from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

#Base schema
class AttendanceBase(BaseModel):
    member_id: int = Field(..., gt=0)
    notes: Optional[str] = None
    
#Schema para check-in (crear asistencia)
class AttendanceCheckIn(AttendanceBase):
    pass

#Schema para check-out( actualizar)
class AttendanceCheckOut(BaseModel):
    notes: Optional[str] = None

# Schema para nuevo miembro
class MemberInfo(BaseModel):
    first_name: str
    last_name_paternal: str
    email: Optional[str] = None
    phone: Optional[str] = None
    
    class Config:
        from_attributes = True

#Schema para respuesta (lo que devuelve la API)
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

#Schema con datos del miembro (para listados)
class AttendanceWithMemberResponse(AttendanceResponse):
    member: MemberInfo
    
    class Config:
        from_attributes = True
        
#Schema para estadisticas
class AttendanceStats(BaseModel):
    total_visits: int
    unique_members: int
    average_duration_minutes: Optional[float] = None
    current_members_in_gym: int