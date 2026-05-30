import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/threat_db")
    
    # JWT
    SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 480
    
    # ML Model Path
    MODEL_PATH = os.getenv("MODEL_PATH", "app/ml/model.pkl")
    SCALER_PATH = os.getenv("SCALER_PATH", "app/ml/scaler.pkl")
    
    # Alert thresholds
    HIGH_RISK_THRESHOLD = 60
    CRITICAL_RISK_THRESHOLD = 80
    
    # Log collection settings
    LOG_COLLECTION_INTERVAL = 2  # seconds

config = Config()
