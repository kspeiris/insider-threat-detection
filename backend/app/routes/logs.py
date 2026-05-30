from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from ..database import get_db
from ..models import LoginLog, FileLog, USBLog, PrivilegeLog
from ..schemas import LoginLogCreate, FileLogCreate, USBLogCreate
from ..services.risk_engine import RiskEngine

router = APIRouter()

@router.post("/login")
def create_login_log(
    log: LoginLogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_log = LoginLog(
        user_id=log.user_id,
        login_time=log.login_time or datetime.utcnow(),
        logout_time=log.logout_time,
        ip_address=log.ip_address,
        hostname=log.hostname
    )
    db.add(db_log)
    db.commit()
    
    # Re-evaluate user risk in background
    background_tasks.add_task(evaluate_user_risk, log.user_id, db)
    
    return {"message": "Login log created", "id": db_log.id}

@router.post("/file")
def create_file_log(
    log: FileLogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_log = FileLog(
        user_id=log.user_id,
        file_name=log.file_name,
        file_path=log.file_path,
        action=log.action,
        file_size=log.file_size,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    
    background_tasks.add_task(evaluate_user_risk, log.user_id, db)
    
    return {"message": "File log created", "id": db_log.id}

@router.post("/usb")
def create_usb_log(
    log: USBLogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_log = USBLog(
        user_id=log.user_id,
        device_id=log.device_id,
        action=log.action,
        data_transferred=log.data_transferred,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    
    background_tasks.add_task(evaluate_user_risk, log.user_id, db)
    
    return {"message": "USB log created", "id": db_log.id}

@router.post("/privilege")
def create_privilege_log(
    user_id: int,
    event_type: str,
    old_role: str = None,
    new_role: str = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    db_log = PrivilegeLog(
        user_id=user_id,
        event_type=event_type,
        old_role=old_role,
        new_role=new_role,
        timestamp=datetime.utcnow()
    )
    db.add(db_log)
    db.commit()
    
    if background_tasks:
        background_tasks.add_task(evaluate_user_risk, user_id, db)
    
    return {"message": "Privilege log created"}

def evaluate_user_risk(user_id: int, db: Session):
    """Background task to evaluate user risk"""
    try:
        engine = RiskEngine(db)
        engine.evaluate_user(user_id)
    except Exception as e:
        print(f"Error evaluating user {user_id}: {e}")
