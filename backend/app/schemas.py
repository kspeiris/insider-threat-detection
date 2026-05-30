from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    department: str = "General"
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Login schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

# Log schemas
class LoginLogCreate(BaseModel):
    user_id: int
    login_time: datetime
    logout_time: Optional[datetime] = None
    ip_address: Optional[str] = None
    hostname: Optional[str] = None

class FileLogCreate(BaseModel):
    user_id: int
    file_name: str
    action: str
    file_path: Optional[str] = None
    file_size: Optional[int] = 0

class USBLogCreate(BaseModel):
    user_id: int
    device_id: str
    action: str
    data_transferred: float = 0.0

# Alert schemas
class AlertResponse(BaseModel):
    id: int
    user_id: int
    alert_type: str
    severity: str
    description: str
    status: str
    timestamp: datetime

# Risk schemas
class RiskScoreResponse(BaseModel):
    user_id: int
    score: float
    risk_level: str
    timestamp: datetime

# Dashboard schemas
class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    high_risk_users: int
    critical_alerts: int
    total_alerts: int
