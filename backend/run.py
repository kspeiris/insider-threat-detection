#!/usr/bin/env python3
"""
Run script for Insider Threat Detection Backend
Usage: python run.py
"""

import uvicorn
import os
import sys

def check_model_files():
    """Check if ML model files exist"""
    model_path = "app/ml/model.pkl"
    scaler_path = "app/ml/scaler.pkl"
    
    if not os.path.exists(model_path):
        print("⚠️ WARNING: model.pkl not found in app/ml/")
        print("   The system will use default detection rules.")
        print("   For full functionality, place your trained model from Colab.")
        return False
    
    if not os.path.exists(scaler_path):
        print("⚠️ WARNING: scaler.pkl not found in app/ml/")
    
    print("✅ Model files found")
    return True

def check_database():
    """Check if database is configured"""
    from dotenv import load_dotenv
    load_dotenv()
    
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("⚠️ WARNING: DATABASE_URL not set in .env")
        print("   Using default SQLite (not recommended for production)")
        return False
    
    print(f"✅ Database configured: {database_url.split('@')[-1] if '@' in database_url else 'local'}")
    return True

def main():
    print("="*60)
    print("🔐 INSIDER THREAT DETECTION SYSTEM")
    print("="*60)
    
    # Check requirements
    print("\n📋 Checking system requirements...")
    check_model_files()
    check_database()
    
    # Run the application
    print("\n🚀 Starting FastAPI server...")
    print("   API Docs: http://localhost:8000/docs")
    print("   Health Check: http://localhost:8000/health")
    print("   Press Ctrl+C to stop")
    print("="*60 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
