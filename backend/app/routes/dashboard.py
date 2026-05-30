from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from ..database import get_db
from ..models import User, Alert, RiskScore, LoginLog, FileLog
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

@router.get("/alerts-distribution")
def get_alerts_distribution(days: int = 30, db: Session = Depends(get_db)):
    """Get alert counts grouped by severity"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    results = db.query(
        Alert.severity, func.count(Alert.id)
    ).filter(Alert.timestamp >= cutoff).group_by(Alert.severity).all()
    
    distribution = [{"name": r[0], "value": r[1]} for r in results]
    # Ensure all severities are represented even if 0
    severities = ['Critical', 'High', 'Medium', 'Low']
    found = {d['name'] for d in distribution}
    for s in severities:
        if s not in found:
            distribution.append({"name": s, "value": 0})
            
    # Sort by severity severity
    order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    return sorted(distribution, key=lambda x: order.get(x['name'], 99))

@router.get("/hourly-activity")
def get_hourly_activity(days: int = 7, db: Session = Depends(get_db)):
    """Get system activity aggregated by hour of day"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    hourly_counts = [{"hour": f"{h:02d}:00", "logins": 0, "file_access": 0, "other": 0} for h in range(24)]
    
    logins = db.query(LoginLog.login_time).filter(LoginLog.login_time >= cutoff).all()
    for log in logins:
        if log.login_time:
            hour = log.login_time.hour
            hourly_counts[hour]['logins'] += 1
            
    files = db.query(FileLog.timestamp).filter(FileLog.timestamp >= cutoff).all()
    for log in files:
        if log.timestamp:
            hour = log.timestamp.hour
            hourly_counts[hour]['file_access'] += 1
            
    return hourly_counts
