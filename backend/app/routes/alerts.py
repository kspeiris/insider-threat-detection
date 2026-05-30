from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Alert
from ..schemas import AlertResponse

router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status:
        query = query.filter(Alert.status == status)
    
    alerts = query.order_by(Alert.timestamp.desc()).limit(100).all()
    return alerts

@router.put("/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "resolved"
    db.commit()
    return {"message": "Alert resolved", "alert_id": alert_id}

@router.put("/{alert_id}/investigate")
def investigate_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "investigating"
    db.commit()
    return {"message": "Alert under investigation", "alert_id": alert_id}
