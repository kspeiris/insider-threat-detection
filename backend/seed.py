import random
from datetime import datetime, timedelta
from app.database import SessionLocal, init_db
from app.models import User, LoginLog, FileLog, USBLog, RiskScore, Alert
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_data():
    db = SessionLocal()
    
    # 1. Add Users
    users_data = [
        {"username": "alice.smith", "dept": "Engineering"},
        {"username": "bob.jones", "dept": "HR"},
        {"username": "charlie.brown", "dept": "Finance"},
        {"username": "dave.williams", "dept": "Engineering"},
        {"username": "eve.hacker", "dept": "Contractor"}
    ]
    
    users = []
    for u in users_data:
        user = db.query(User).filter(User.username == u["username"]).first()
        if not user:
            user = User(
                username=u["username"],
                email=f"{u['username']}@company.com",
                hashed_password=pwd_context.hash("password123"),
                department=u["dept"],
                role="employee"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        users.append(user)
        
    now = datetime.utcnow()
    
    # 2. Add Logs (Last 7 days)
    print("Generating logs...")
    for user in users:
        for day in range(7):
            current_date = now - timedelta(days=6-day)
            
            # 2-5 logins per day per user
            num_logins = random.randint(2, 5)
            # Eve is suspicious, logs in at night
            is_suspicious = user.username == 'eve.hacker'
            
            for _ in range(num_logins):
                hour = random.randint(1, 4) if is_suspicious else random.randint(8, 18)
                login_time = current_date.replace(hour=hour, minute=random.randint(0, 59))
                db.add(LoginLog(
                    user_id=user.id,
                    login_time=login_time,
                    ip_address=f"192.168.1.{random.randint(10, 100)}"
                ))
                
            # File accesses
            num_files = random.randint(20, 100)
            if is_suspicious: num_files = random.randint(200, 500)
            
            for _ in range(num_files):
                f_hour = random.randint(1, 4) if is_suspicious else random.randint(8, 18)
                file_time = current_date.replace(hour=f_hour, minute=random.randint(0, 59))
                db.add(FileLog(
                    user_id=user.id,
                    file_name=f"document_{random.randint(1,1000)}.pdf",
                    action=random.choice(["read", "write", "download"]),
                    timestamp=file_time
                ))
                
        # 3. Add Risk Scores (Trend)
        for day in range(7):
            current_date = now - timedelta(days=6-day)
            score = random.uniform(10, 30)
            level = "Low"
            if is_suspicious:
                score = random.uniform(70, 95)
                level = "Critical" if score > 85 else "High"
            
            db.add(RiskScore(
                user_id=user.id,
                score=score,
                risk_level=level,
                anomaly_score=score / 100,
                timestamp=current_date
            ))
            
    # 4. Add Alerts
    print("Generating alerts...")
    alerts_data = [
        ("Critical", "Multiple failed logins and unusual data exfiltration detected.", "eve.hacker"),
        ("High", "Late night access to confidential HR files.", "eve.hacker"),
        ("Medium", "Unusual volume of files copied to external drive.", "bob.jones"),
        ("Low", "Login from new IP address inside office network.", "alice.smith")
    ]
    
    for severity, desc, username in alerts_data:
        u = next(u for u in users if u.username == username)
        db.add(Alert(
            user_id=u.id,
            severity=severity,
            description=desc,
            status="new",
            timestamp=now - timedelta(hours=random.randint(1, 24))
        ))
        
    db.commit()
    db.close()
    print("✅ Seed data populated successfully!")

if __name__ == "__main__":
    init_db()
    seed_data()
