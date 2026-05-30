"""
Linux Real-Time Log Collector using auditd
Requires: sudo apt-get install auditd audispd-plugins
"""

import asyncio
import subprocess
import json
import platform
import re
from datetime import datetime
from typing import Dict, Any
import httpx

API_URL = "http://localhost:8000/api"

class LinuxEventCollector:
    def __init__(self, api_url: str = API_URL):
        self.api_url = api_url
        self.running = True
        
    def check_auditd(self) -> bool:
        """Check if auditd is installed and running"""
        try:
            result = subprocess.run(
                ['systemctl', 'is-active', 'auditd'],
                capture_output=True,
                text=True
            )
            return result.stdout.strip() == 'active'
        except:
            return False
    
    def setup_audit_rules(self):
        """Setup audit rules for monitoring"""
        rules = [
            'auditctl -w /etc/passwd -p wa -k user_changes',
            'auditctl -w /etc/sudoers -p wa -k sudo_changes',
            'auditctl -a always,exit -S openat -F success=1 -k file_access',
            'auditctl -a always,exit -S execve -k process_execution'
        ]
        
        for rule in rules:
            try:
                subprocess.run(rule.split(), capture_output=True)
            except:
                pass
        
        print("✅ Audit rules configured")
    
    async def collect_events(self) -> list:
        """Collect recent audit events"""
        try:
            # Get recent audit logs
            result = subprocess.run(
                ['ausearch', '-ts', 'recent', '-m', 'USER_LOGIN,USER_LOGOUT,USER_START,SYSCALL'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            events = []
            if result.stdout:
                # Parse ausearch output
                current_event = {}
                for line in result.stdout.split('\n'):
                    if line.startswith('time->'):
                        if current_event:
                            events.append(current_event)
                            current_event = {}
                        
                        # Extract timestamp
                        time_match = re.search(r'time->(.*)', line)
                        if time_match:
                            current_event['timestamp'] = time_match.group(1)
                    
                    elif 'type=' in line:
                        type_match = re.search(r'type=(\w+)', line)
                        if type_match:
                            current_event['type'] = type_match.group(1)
                    
                    elif 'uid=' in line:
                        uid_match = re.search(r'uid=(\d+)', line)
                        if uid_match:
                            current_event['uid'] = uid_match.group(1)
                    
                    elif 'exe=' in line:
                        exe_match = re.search(r'exe="([^"]+)"', line)
                        if exe_match:
                            current_event['exe'] = exe_match.group(1)
                
                if current_event:
                    events.append(current_event)
            
            return events
            
        except subprocess.TimeoutExpired:
            return []
        except Exception as e:
            print(f"Error collecting events: {e}")
            return []
    
    def parse_event(self, event: Dict) -> Dict:
        """Parse audit event to our format"""
        parsed = {
            'timestamp': event.get('timestamp'),
            'user_id': event.get('uid', 'unknown'),
            'type': 'login',  # default
        }
        
        event_type = event.get('type', '')
        
        if 'LOGIN' in event_type:
            parsed['type'] = 'login'
            parsed['action'] = 'login'
        elif 'LOGOUT' in event_type:
            parsed['type'] = 'login'
            parsed['action'] = 'logout'
        elif 'SYSCALL' in event_type:
            exe = event.get('exe', '')
            if 'bin' in exe:
                parsed['type'] = 'file'
                parsed['action'] = 'access'
                parsed['file_name'] = exe.split('/')[-1]
        
        return parsed
    
    async def send_to_api(self, parsed_event: Dict):
        """Send parsed event to backend API"""
        async with httpx.AsyncClient() as client:
            try:
                endpoint = f"{self.api_url}/logs/{parsed_event.get('type', 'login')}"
                response = await client.post(endpoint, json=parsed_event, timeout=5)
                if response.status_code == 200:
                    print(f"✅ Sent: {parsed_event.get('type')} event")
            except Exception as e:
                print(f"❌ Failed to send event: {e}")
    
    async def run(self):
        """Main collector loop"""
        print("🔍 Linux Audit Collector Started")
        print("📡 Sending events to:", self.api_url)
        
        # Check auditd status
        if not self.check_auditd():
            print("⚠️ auditd is not running")
            print("   Install and start auditd:")
            print("   sudo apt-get install auditd")
            print("   sudo systemctl start auditd")
            return
        
        self.setup_audit_rules()
        print("Press Ctrl+C to stop\n")
        
        while self.running:
            events = await self.collect_events()
            
            for event in events:
                parsed = self.parse_event(event)
                if parsed.get('user_id') != 'unknown':
                    await self.send_to_api(parsed)
            
            await asyncio.sleep(2)
    
    def stop(self):
        self.running = False

async def main():
    if platform.system() != "Linux":
        print("❌ This collector only works on Linux")
        print("   For Windows, use windows_collector.py")
        return
    
    collector = LinuxEventCollector()
    
    try:
        await collector.run()
    except KeyboardInterrupt:
        print("\n🛑 Stopping collector...")
        collector.stop()

if __name__ == "__main__":
    asyncio.run(main())
