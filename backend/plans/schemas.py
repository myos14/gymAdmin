from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from typing import Optional
import re

class PlanBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    duration_days: int = Field(..., ge=0)
    description: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        # Eliminar espacios al inicio y final
        v = v.strip()
        
        # Validar que no esté vacío después de strip
        if not v:
            raise ValueError('El nombre no puede estar vacío')
        
        # Validar que solo contenga letras, números, espacios y guiones
        if not re.match(r'^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$', v):
            raise ValueError('El nombre solo puede contener letras, números, espacios y guiones')
        
        return v
    
    @field_validator('duration_days')
    @classmethod
    def validate_duration(cls, v):
        # Permitir 0 para planes permanentes (como Staff)
        if v == 0:
            return v
        
        # Para planes normales, validar rango razonable
        if v < 1:
            raise ValueError('La duración debe ser mayor a 0 días')
        
        # Máximo 10 años (3650 días) para planes regulares
        # Si necesitas permanente, usa 0 o contacta admin
        if v > 3650:
            raise ValueError('La duración máxima es de 3650 días (10 años). Para planes permanentes usa 0 días')
        
        return v
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        # Permitir precio 0 para planes gratuitos
        if v < 0:
            raise ValueError('El precio no puede ser negativo')
        
        # Validar que no sea un precio absurdo
        if v > 100000:
            raise ValueError('El precio no puede exceder $100,000')
        
        return v

class PlanCreate(PlanBase):
    """Schema para crear planes - CON validaciones"""
    pass

class PlanUpdate(BaseModel):
    """Schema para actualizar planes - CON validaciones opcionales"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    duration_days: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if v is None:
            return v
            
        v = v.strip()
        
        if not v:
            raise ValueError('El nombre no puede estar vacío')
        
        if not re.match(r'^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$', v):
            raise ValueError('El nombre solo puede contener letras, números, espacios y guiones')
        
        return v
    
    @field_validator('duration_days')
    @classmethod
    def validate_duration(cls, v):
        if v is None:
            return v
            
        # Permitir 0 para permanente
        if v == 0:
            return v
        
        if v < 1:
            raise ValueError('La duración debe ser mayor a 0 días')
        
        if v > 3650:
            raise ValueError('La duración máxima es de 3650 días (10 años). Para planes permanentes usa 0 días')
        
        return v
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v is None:
            return v
            
        if v < 0:
            raise ValueError('El precio no puede ser negativo')
        
        if v > 100000:
            raise ValueError('El precio no puede exceder $100,000')
        
        return v

class PlanResponse(BaseModel):
    """Schema para respuestas - SIN validaciones estrictas"""
    id: int
    name: str
    price: Decimal
    duration_days: int
    description: Optional[str] = None
    is_active: bool
    
    class Config:
        from_attributes = True