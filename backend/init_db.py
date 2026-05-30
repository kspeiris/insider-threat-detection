"""Initialize database and create tables"""
from app.database import init_db, SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    
    # Check if admin exists
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            email="admin@security.com",
            hashed_password=pwd_context.hash("admin123"),
            department="Security",
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Admin user created: admin / admin123")
    else:
        print("Admin user already exists")
    
    db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    create_admin_user()
    print("✅ Database initialization complete!")
