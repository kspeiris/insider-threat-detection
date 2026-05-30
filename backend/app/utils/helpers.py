from datetime import datetime, timedelta
from typing import List, Dict, Any
import re

def calculate_time_diff(start_time: datetime, end_time: datetime) -> float:
    """Calculate time difference in hours"""
    diff = end_time - start_time
    return diff.total_seconds() / 3600

def is_late_night(dt: datetime) -> bool:
    """Check if time is between 12 AM and 5 AM"""
    return dt.hour < 5 or dt.hour > 22

def is_weekend(dt: datetime) -> bool:
    """Check if date is weekend"""
    return dt.weekday() >= 5

def normalize_risk_score(score: float, min_val: float = -1, max_val: float = 1) -> float:
    """Normalize anomaly score to 0-100 range"""
    normalized = (score - min_val) / (max_val - min_val) * 100
    return max(0, min(100, normalized))

def generate_alert_description(
    user_id: int,
    risk_level: str,
    features: Dict[str, float],
    anomaly_score: float
) -> str:
    """Generate human-readable alert description"""
    reasons = []
    
    if features.get('late_night_logins', 0) > 5:
        reasons.append(f"unusual late-night activity ({features['late_night_logins']} times)")
    
    if features.get('usb_connections', 0) > 3:
        reasons.append(f"excessive USB usage ({features['usb_connections']} connections)")
    
    if features.get('data_transferred_gb', 0) > 10:
        reasons.append(f"large data transfer ({features['data_transferred_gb']:.1f} GB)")
    
    if features.get('total_file_accesses', 0) > 200:
        reasons.append(f"unusual file access volume ({features['total_file_accesses']} files)")
    
    if features.get('late_night_ratio', 0) > 0.3:
        reasons.append(f"high proportion of after-hours work ({features['late_night_ratio']*100:.0f}%)")
    
    if not reasons:
        reasons.append(f"anomalous behavior detected (anomaly score: {anomaly_score:.3f})")
    
    return f"User {user_id} - {risk_level} risk: " + ", ".join(reasons)

def extract_ip_from_string(text: str) -> str:
    """Extract IP address from string"""
    pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    match = re.search(pattern, text)
    return match.group(0) if match else "unknown"

def format_timestamp(dt: datetime) -> str:
    """Format datetime for display"""
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def aggregate_events_by_hour(events: List[Any], timestamp_field: str = 'timestamp') -> Dict[int, int]:
    """Aggregate events by hour of day"""
    hour_counts = {h: 0 for h in range(24)}
    for event in events:
        ts = getattr(event, timestamp_field, None)
        if ts:
            hour_counts[ts.hour] += 1
    return hour_counts

def calculate_percentile(values: List[float], percentile: float) -> float:
    """Calculate percentile of values"""
    if not values:
        return 0
    sorted_values = sorted(values)
    index = int(len(sorted_values) * percentile / 100)
    return sorted_values[min(index, len(sorted_values) - 1)]

def detect_spike(current: float, baseline: float, threshold: float = 3.0) -> bool:
    """Detect if current value is a spike compared to baseline"""
    if baseline == 0:
        return current > threshold
    return current / baseline > threshold

def safe_divide(a: float, b: float, default: float = 0) -> float:
    """Safe division to avoid division by zero"""
    return a / b if b != 0 else default

def truncate_string(s: str, max_length: int = 100) -> str:
    """Truncate string to max length"""
    if len(s) <= max_length:
        return s
    return s[:max_length - 3] + "..."

def get_severity_color(severity: str) -> str:
    """Get color code for severity level"""
    colors = {
        'Critical': '#9c27b0',
        'High': '#f44336',
        'Medium': '#ff9800',
        'Low': '#4caf50'
    }
    return colors.get(severity, '#757575')

def calculate_risk_trend(risk_scores: List[float]) -> str:
    """Calculate risk trend (increasing, decreasing, stable)"""
    if len(risk_scores) < 2:
        return "stable"
    
    first_half = sum(risk_scores[:len(risk_scores)//2]) / max(1, len(risk_scores)//2)
    second_half = sum(risk_scores[len(risk_scores)//2:]) / max(1, len(risk_scores[len(risk_scores)//2:]))
    
    if second_half > first_half * 1.2:
        return "increasing"
    elif second_half < first_half * 0.8:
        return "decreasing"
    else:
        return "stable"
