from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User, RiskScore
from ..schemas import UserResponse
from ..services.risk_engine import RiskEngine
from ..services.feature_extractor import FeatureExtractor

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.is_active == True)
    if department:
        query = query.filter(User.department == department)
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/{user_id}/risk-history")
def get_user_risk_history(user_id: int, days: int = 30, db: Session = Depends(get_db)):
    from datetime import datetime, timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    scores = db.query(RiskScore).filter(
        RiskScore.user_id == user_id,
        RiskScore.timestamp > cutoff
    ).order_by(RiskScore.timestamp).all()
    
    return [{
        "score": s.score,
        "risk_level": s.risk_level,
        "timestamp": s.timestamp.isoformat()
    } for s in scores]

@router.get("/{user_id}/features")
def get_user_features(user_id: int, days: int = 30, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    extractor = FeatureExtractor(db)
    features = extractor.extract_features(user_id, days=days)
    
    # Format for Radar Chart
    # Values are normalized relative to arbitrary baselines for display purposes
    return [
        {"subject": "Total Logins", "A": min(100, features.get('total_logins', 0) * 2), "fullMark": 100},
        {"subject": "Failed Logins", "A": min(100, features.get('failed_logins', 0) * 10), "fullMark": 100},
        {"subject": "Late Night Logins", "A": min(100, features.get('late_night_logins', 0) * 20), "fullMark": 100},
        {"subject": "File Accesses", "A": min(100, features.get('total_file_accesses', 0) / 10), "fullMark": 100},
        {"subject": "USB Connections", "A": min(100, features.get('usb_connections', 0) * 15), "fullMark": 100},
        {"subject": "Data Transferred", "A": min(100, features.get('data_transferred_gb', 0) * 5), "fullMark": 100}
    ]

@router.post("/{user_id}/evaluate")
def evaluate_user(user_id: int, db: Session = Depends(get_db)):
    engine = RiskEngine(db)
    result = engine.evaluate_user(user_id)
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return result

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    return {"message": "User deactivated"}
