from sqlalchemy import Column, Integer, Date, TIMESTAMP, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy import func
from database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="SET NULL"))
    check_in_time = Column(TIMESTAMP, nullable=False, server_default=func.now())
    check_out_time = Column(TIMESTAMP)
    date = Column(Date, nullable=False, server_default=func.current_date())
    duration_minutes = Column(Integer)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    #Relationships
    member = relationship("Member", back_populates="attendances")
    subscription = relationship("Subscription", back_populates="attendances")