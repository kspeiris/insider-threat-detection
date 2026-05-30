from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, RiskScore
from ..services.risk_engine import RiskEngine
from ..schemas import RiskScoreResponse

router = APIRouter()

@router.get("/scores")
def get_risk_scores(db: Session = Depends(get_db)):
    """Get latest risk scores for all users"""
    from sqlalchemy import distinct, func
    
    # Get latest score for each user
    subquery = db.query(
        RiskScore.user_id,
        func.max(RiskScore.timestamp).label('max_time')
    ).group_by(RiskScore.user_id).subquery()
    
    scores = db.query(RiskScore).join(
        subquery,
        (RiskScore.user_id == subquery.c.user_id) &
        (RiskScore.timestamp == subquery.c.max_time)
    ).all()
    
    return scores

@router.get("/user/{user_id}")
def get_user_risk(user_id: int, db: Session = Depends(get_db)):
    """Get risk score for specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    engine = RiskEngine(db)
    risk_result = engine.evaluate_user(user_id)
    
    return {"user_id": user_id, "username": user.username, **risk_result}

@router.post("/evaluate/{user_id}")
def evaluate_user(user_id: int, db: Session = Depends(get_db)):
    """Force evaluation of a user"""
    engine = RiskEngine(db)
    result = engine.evaluate_user(user_id)
    return result
