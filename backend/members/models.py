from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Member(Base):
    __tablename__ = 'members'

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    last_name_paternal = Column(String(50), nullable=False)
    last_name_maternal = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True, unique=True)
    registration_date = Column(Date, nullable=False)
    photo_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="member")
    payments = relationship("PaymentRecord", back_populates="member")
    attendances = relationship("Attendance", back_populates="member")