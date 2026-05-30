from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import asyncio

from .database import get_db, init_db
from .models import User, Alert
from .schemas import *
from .routes import auth, users, alerts, risk, dashboard

app = FastAPI(title="Insider Threat Detection System", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
# app.include_router(users.router, prefix="/api/users", tags=["users"]) # Assuming you create users.py later

@app.on_event("startup")
async def startup_event():
    init_db()
    print("🚀 Insider Threat Detection System Started!")
    print("📡 API available at http://localhost:8000")
    print("📚 API Docs at http://localhost:8000/docs")

@app.get("/")
def root():
    return {"message": "Insider Threat Detection API", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.websocket("/ws/live-events")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast({"type": "event", "data": data, "timestamp": datetime.utcnow().isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
