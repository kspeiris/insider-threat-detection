from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import User, RiskScore
from ..schemas import UserResponse
from ..services.risk_engine import RiskEngine

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
