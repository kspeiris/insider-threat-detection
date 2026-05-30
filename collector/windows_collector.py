"""
Windows Real-Time Log Collector using Windows Event Log
Requires: Run as Administrator
"""

import asyncio
import subprocess
import json
import sys
import platform
from datetime import datetime
from typing import Dict, Any
import httpx

API_URL = "http://localhost:8000/api"

# Event IDs to monitor
# 4624: Successful logon
# 4625: Failed logon  
# 4663: File access
# 4656: Handle to object requested
# 6416: USB device connected
# 4672: Special privileges assigned (admin)
EVENT_IDS = {
    "login": [4624, 4625],
    "file": [4663, 4656],
    "privilege": [4672, 4673, 4674]
}

class WindowsEventCollector:
    def __init__(self, api_url: str = API_URL):
        self.api_url = api_url
        self.running = True
        
    async def collect_events(self) -> list:
        """Collect recent Windows events using PowerShell"""
        try:
            # Build PowerShell command to get recent events
            ps_command = '''
            $events = @()
            $eventIds = @(4624, 4625, 4663, 4656, 4672)
            
            foreach ($id in $eventIds) {
                $events += Get-WinEvent -FilterHashtable @{
                    LogName='Security'
                    ID=$id
                    StartTime=(Get-Date).AddMinutes(-1)
                } -ErrorAction SilentlyContinue | Select-Object -First 5
            }
            
            $events | ConvertTo-Json -Depth 3
            '''
            
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.stdout and result.stdout.strip():
                try:
                    events = json.loads(result.stdout)
                    if not isinstance(events, list):
                        events = [events]
                    return events
                except json.JSONDecodeError:
                    return []
            return []
            
        except subprocess.TimeoutExpired:
            print("⚠️ PowerShell command timed out")
            return []
        except Exception as e:
            print(f"Error collecting events: {e}")
            return []
    
    def parse_event(self, event: Dict) -> Dict:
        """Parse Windows event to our format"""
        event_id = event.get('Id')
        time_created = event.get('TimeCreated')
        message = event.get('Message', '')
        
        # Extract user from message
        user = "unknown"
        for line in message.split('\n'):
            if 'Account Name:' in line:
                user = line.split('Account Name:')[-1].strip()
                break
            if 'Subject:' in line and 'Account Name' in line:
                parts = line.split()
                for i, part in enumerate(parts):
                    if part == 'Name:' and i+1 < len(parts):
                        user = parts[i+1]
                        break
        
        parsed = {
            'event_id': event_id,
            'timestamp': time_created,
            'user': user
        }
        
        # Classify event type
        if event_id == 4624:
            parsed['type'] = 'login'
            parsed['action'] = 'success'
        elif event_id == 4625:
            parsed['type'] = 'login'
            parsed['action'] = 'failed'
        elif event_id in [4663, 4656]:
            parsed['type'] = 'file'
            # Extract file name from message
            for line in message.split('\n'):
                if 'Object Name:' in line:
                    parsed['file_name'] = line.split('Object Name:')[-1].strip()
                    break
        elif event_id == 4672:
            parsed['type'] = 'privilege'
            parsed['action'] = 'admin_assigned'
        
        return parsed
    
    async def send_to_api(self, parsed_event: Dict):
        """Send parsed event to backend API"""
        async with httpx.AsyncClient() as client:
            try:
                endpoint = f"{self.api_url}/logs/{parsed_event.get('type', 'login')}"
                response = await client.post(endpoint, json=parsed_event, timeout=5)
                if response.status_code == 200:
                    print(f"✅ Sent: {parsed_event.get('type')} event for {parsed_event.get('user')}")
            except Exception as e:
                print(f"❌ Failed to send event: {e}")
    
    async def run(self):
        """Main collector loop"""
        print("🔍 Windows Event Collector Started")
        print("📡 Sending events to:", self.api_url)
        print("Press Ctrl+C to stop\n")
        
        while self.running:
            events = await self.collect_events()
            
            for event in events:
                parsed = self.parse_event(event)
                if parsed.get('user') != 'unknown' and parsed.get('user') != 'SYSTEM':
                    await self.send_to_api(parsed)
            
            await asyncio.sleep(2)  # Collect every 2 seconds
    
    def stop(self):
        self.running = False

async def main():
    if platform.system() != "Windows":
        print("❌ This collector only works on Windows")
        print("   For Linux, use linux_collector.py")
        return
    
    # Check if running as admin
    try:
        import ctypes
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
        if not is_admin:
            print("⚠️ WARNING: Not running as Administrator")
            print("   Some events may not be accessible")
            print("   Please run as Administrator for full functionality\n")
    except:
        pass
    
    collector = WindowsEventCollector()
    
    try:
        await collector.run()
    except KeyboardInterrupt:
        print("\n🛑 Stopping collector...")
        collector.stop()

if __name__ == "__main__":
    asyncio.run(main())
