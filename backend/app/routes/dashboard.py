from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Alert, RiskScore
from ..schemas import DashboardStats

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total_users = db.query(User).filter(User.is_active == True).count()
    
    # Active users in last 24 hours
    day_ago = datetime.utcnow() - timedelta(days=1)
    active_users = db.query(RiskScore.user_id).filter(
        RiskScore.timestamp > day_ago
    ).distinct().count()
    
    # High risk users
    high_risk = db.query(RiskScore).filter(
        RiskScore.risk_level.in_(['High', 'Critical'])
    ).count()
    
    # Critical alerts
    critical_alerts = db.query(Alert).filter(
        Alert.severity == 'Critical',
        Alert.status == 'new'
    ).count()
    
    total_alerts = db.query(Alert).filter(Alert.status == 'new').count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "high_risk_users": high_risk,
        "critical_alerts": critical_alerts,
        "total_alerts": total_alerts
    }

@router.get("/risk-trends")
def get_risk_trends(days: int = 7, db: Session = Depends(get_db)):
    """Get risk score trends over time"""
    results = []
    for i in range(days):
        date = datetime.utcnow().date() - timedelta(days=i)
        next_date = date + timedelta(days=1)
        
        avg_risk = db.query(func.avg(RiskScore.score)).filter(
            RiskScore.timestamp >= date,
            RiskScore.timestamp < next_date
        ).scalar()
        
        results.append({
            "date": date.isoformat(),
            "avg_risk": float(avg_risk) if avg_risk else 0
        })
    
    return results[::-1]  # Oldest first

@router.get("/top-risky-users")
def get_top_risky_users(limit: int = 10, db: Session = Depends(get_db)):
    """Get top risky users"""
    from sqlalchemy import distinct
    
    # Get latest risk scores
    latest_scores = db.query(
        RiskScore.user_id,
        RiskScore.score,
        RiskScore.risk_level
    ).order_by(RiskScore.timestamp.desc()).limit(100).all()
    
    # Deduplicate by user
    unique_scores = {}
    for score in latest_scores:
        if score.user_id not in unique_scores:
            unique_scores[score.user_id] = score
    
    # Sort by risk score
    sorted_scores = sorted(unique_scores.values(), key=lambda x: x.score, reverse=True)[:limit]
    
    result = []
    for score in sorted_scores:
        user = db.query(User).filter(User.id == score.user_id).first()
        result.append({
            "user_id": score.user_id,
            "username": user.username if user else "Unknown",
            "risk_score": score.score,
            "risk_level": score.risk_level
        })
    
    return result
