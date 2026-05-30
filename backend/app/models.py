from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    department = Column(String(50))
    role = Column(String(50), default="employee")
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    login_logs = relationship("LoginLog", back_populates="user")
    file_logs = relationship("FileLog", back_populates="user")
    usb_logs = relationship("USBLog", back_populates="user")
    risk_scores = relationship("RiskScore", back_populates="user")
    alerts = relationship("Alert", back_populates="user")

class LoginLog(Base):
    __tablename__ = "login_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    login_time = Column(DateTime, nullable=False)
    logout_time = Column(DateTime, nullable=True)
    ip_address = Column(String(45))
    hostname = Column(String(100))
    
    user = relationship("User", back_populates="login_logs")

class FileLog(Base):
    __tablename__ = "file_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_name = Column(String(255))
    file_path = Column(String(500))
    action = Column(String(20))  # open, read, write, delete, copy
    file_size = Column(Integer, default=0)  # bytes
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="file_logs")

class USBLog(Base):
    __tablename__ = "usb_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_id = Column(String(100))
    device_name = Column(String(100))
    action = Column(String(20))  # connect, disconnect
    data_transferred = Column(Float, default=0.0)  # MB
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="usb_logs")

class PrivilegeLog(Base):
    __tablename__ = "privilege_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_type = Column(String(50))  # sudo, admin_request, role_change
    old_role = Column(String(50), nullable=True)
    new_role = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    risk_level = Column(String(20))  # Low, Medium, High, Critical
    anomaly_score = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="risk_scores")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    alert_type = Column(String(50))
    severity = Column(String(20))
    description = Column(Text)
    status = Column(String(20), default="new")
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="alerts")
