from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime
from typing import Optional
import re

class MemberBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name_paternal: str = Field(..., min_length=2, max_length=50)
    last_name_maternal: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=15)
    
    @field_validator('first_name', 'last_name_paternal', 'last_name_maternal', 'emergency_contact')
    @classmethod
    def validate_name(cls, v):
        if v and not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
            raise ValueError('Solo se permiten letras y espacios')
        return v.strip() if v else v
    
    @field_validator('phone', 'emergency_phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            # Remover espacios y guiones
            cleaned = re.sub(r'[\s\-()]', '', v)
            # Validar que sean solo dígitos (10 dígitos para México)
            if not re.match(r'^\d{10}$', cleaned):
                raise ValueError('El teléfono debe tener 10 dígitos')
            return cleaned
        return v
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date(cls, v):
        if v:  # Solo validar si existe
            today = date.today()
            if v > today:
                raise ValueError('La fecha de nacimiento no puede ser futura')
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 10:
                raise ValueError('El miembro debe tener al menos 10 años')
            if age > 100:
                raise ValueError('Fecha de nacimiento no válida')
        return v

class MemberCreate(MemberBase):
    """Schema para crear miembros """
    pass

class MemberUpdate(BaseModel):
    """Schema para actualizar miembros """
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name_paternal: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name_maternal: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=15)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, max_length=100)
    emergency_phone: Optional[str] = Field(None, max_length=15)
    is_active: Optional[bool] = None
    
    @field_validator('first_name', 'last_name_paternal', 'last_name_maternal', 'emergency_contact')
    @classmethod
    def validate_name(cls, v):
        if v and not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', v):
            raise ValueError('Solo se permiten letras y espacios')
        return v.strip() if v else v
    
    @field_validator('phone', 'emergency_phone')
    @classmethod
    def validate_phone(cls, v):
        if v:
            cleaned = re.sub(r'[\s\-()]', '', v)
            if not re.match(r'^\d{10}$', cleaned):
                raise ValueError('El teléfono debe tener 10 dígitos')
            return cleaned
        return v
    
    @field_validator('date_of_birth')
    @classmethod
    def validate_date(cls, v):
        if v:
            today = date.today()
            if v > today:
                raise ValueError('La fecha de nacimiento no puede ser futura')
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 5:
                raise ValueError('El miembro debe tener al menos 5 años')
            if age > 100:
                raise ValueError('Fecha de nacimiento no válida')
        return v

class MemberResponse(BaseModel):
    """Schema para respuestas """
    id: int
    first_name: str
    last_name_paternal: str
    last_name_maternal: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    registration_date: date
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ActiveSubscriptionInfo(BaseModel):
    status: str
    end_date: date
    plan_name: Optional[str] = None
    days_remaining: int

    class Config:
        from_attributes = True

class MemberResponseWithSubscription(MemberResponse):
    active_subscription: Optional[ActiveSubscriptionInfo] = None

    class Config:
        from_attributes = True
