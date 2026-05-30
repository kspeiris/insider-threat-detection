from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict
from ..models import User, LoginLog, FileLog, USBLog

class FeatureExtractor:
    def __init__(self, db: Session):
        self.db = db
    
    def extract_features(self, user_id: int, days: int = 7) -> Dict[str, float]:
        """Extract behavioral features for a user"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Get user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        # Login features
        logins = self.db.query(LoginLog).filter(
            LoginLog.user_id == user_id,
            LoginLog.login_time > cutoff
        ).all()
        
        total_logins = len(logins)
        late_night_logins = sum(1 for l in logins if l.login_time.hour < 5 or l.login_time.hour > 22)
        
        # File access features
        file_accesses = self.db.query(FileLog).filter(
            FileLog.user_id == user_id,
            FileLog.timestamp > cutoff
        ).all()
        
        total_files = len(file_accesses)
        unique_files = len(set(f.file_name for f in file_accesses))
        
        # USB features
        usb_events = self.db.query(USBLog).filter(
            USBLog.user_id == user_id,
            USBLog.timestamp > cutoff
        ).all()
        
        usb_connections = len([u for u in usb_events if u.action == 'connect'])
        total_data = sum(u.data_transferred for u in usb_events)
        
        features = {
            'total_logins': float(total_logins),
            'late_night_logins': float(late_night_logins),
            'late_night_ratio': float(late_night_logins / (total_logins + 1)),
            'total_file_accesses': float(total_files),
            'unique_files_accessed': float(unique_files),
            'usb_connections': float(usb_connections),
            'data_transferred_gb': float(total_data / 1024),
            'avg_files_per_login': float(total_files / (total_logins + 1))
        }
        
        return features
