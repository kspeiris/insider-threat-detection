"""
Simulated log collector for testing
Run this to simulate user activity
"""
import asyncio
import httpx
import random
from datetime import datetime, timedelta

API_URL = "http://localhost:8000/api"
USERS = [1, 2, 3, 4, 5]  # Assuming users exist in DB

async def simulate_user_activity(user_id: int):
    """Simulate normal user activity"""
    # Normal login (9-5)
    login_time = datetime.now().replace(hour=9, minute=random.randint(0, 59))
    
    # Normal file access (20-50 files)
    for _ in range(random.randint(10, 30)):
        await send_file_event(user_id, 'read')
    
    await asyncio.sleep(1)

async def simulate_anomalous_activity(user_id: int):
    """Simulate suspicious behavior"""
    # Late night login
    late_time = datetime.now().replace(hour=2, minute=random.randint(0, 59))
    
    # Mass file access
    for _ in range(random.randint(200, 500)):
        await send_file_event(user_id, 'read')
    
    # USB connection with large data transfer
    await send_usb_event(user_id, 50000)  # 50GB

async def send_file_event(user_id: int, action: str):
    """Send file access event"""
    async with httpx.AsyncClient() as client:
        event = {
            "user_id": user_id,
            "file_name": f"document_{random.randint(1,1000)}.pdf",
            "action": action,
            "file_size": random.randint(1024, 10485760)
        }
        try:
            await client.post(f"{API_URL}/logs/file", json=event)
        except:
            pass

async def send_usb_event(user_id: int, data_gb: float):
    """Send USB event"""
    async with httpx.AsyncClient() as client:
        event = {
            "user_id": user_id,
            "device_id": f"USB-{random.randint(1000,9999)}",
            "action": "connect",
            "data_transferred": data_gb
        }
        try:
            await client.post(f"{API_URL}/logs/usb", json=event)
        except:
            pass

async def main():
    print("Starting simulated log collector...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            # Normal activity for most users
            for user in USERS[:3]:
                await simulate_user_activity(user)
            
            # Anomalous activity for suspicious user
            await simulate_anomalous_activity(USERS[-1])
            
            await asyncio.sleep(5)
    except KeyboardInterrupt:
        print("\nStopping collector...")

if __name__ == "__main__":
    asyncio.run(main())
