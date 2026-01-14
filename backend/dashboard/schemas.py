from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class MemberBasicInfo(BaseModel):
    id: int
    first_name: str
    last_name_paternal: str
    last_name_maternal: Optional[str] = None
    
    class Config:
        from_attributes = True
    
    @property
    def full_name(self) -> str:
        if self.last_name_maternal:
            return f"{self.first_name} {self.last_name_paternal} {self.last_name_maternal}"
        return f"{self.first_name} {self.last_name_paternal}"

class PlanBasicInfo(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class ExpiringSubscription(BaseModel):
    id: int
    member: MemberBasicInfo
    plan: PlanBasicInfo
    end_date: date
    days_remaining: int
    
    class Config:
        from_attributes = True

class RecentCheckIn(BaseModel):
    id: int
    member: MemberBasicInfo
    check_in_time: datetime
    subscription_status: str  # "active", "expiring_soon", "expired"
    
    class Config:
        from_attributes = True

class DailyAttendanceStats(BaseModel):
    date: str
    total_visits: int
    day_name: str

class DashboardMetrics(BaseModel):
    current_in_gym: int
    today_visits: int
    total_members: int
    active_subscriptions: int

class PaymentMetrics(BaseModel):
    today_income: float
    month_income: float
    pending_payments: float

class RecentPayment(BaseModel):
    id: int
    member_name: str
    amount: float
    payment_method: str
    payment_date: str

class DailyIncomeStats(BaseModel):
    date: str
    total_income: float
    day_name: str

class PlanMetric(BaseModel):
    plan_id: int
    plan_name: str
    active_subscriptions: int

class DashboardSummary(BaseModel):
    metrics: DashboardMetrics
    payment_metrics: PaymentMetrics 
    expiring_subscriptions: List[ExpiringSubscription]
    recent_checkins: List[RecentCheckIn]
    recent_payments: List[RecentPayment] 
    weekly_stats: List[DailyAttendanceStats]
    weekly_income: List[DailyIncomeStats]
    plan_metrics: List[PlanMetric]