from sqlalchemy import Column, Integer, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy import func
from database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"))
    check_in_time = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    check_out_time = Column(TIMESTAMP(timezone=True))
    date = Column(Date, nullable=False, server_default=func.current_date())
    duration_minutes = Column(Integer)
    notes = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    member = relationship("Member", back_populates="attendances")
    subscription = relationship("Subscription", back_populates="attendances")