from sqlalchemy.orm import Session
from datetime import datetime
from ..models import RiskScore, Alert, User
from ..ml import ml_model
from .feature_extractor import FeatureExtractor
from datetime import timedelta

class RiskEngine:
    def __init__(self, db: Session):
        self.db = db
        self.feature_extractor = FeatureExtractor(db)
    
    def evaluate_user(self, user_id: int) -> dict:
        """Evaluate a user and generate risk score"""
        # Extract features
        features = self.feature_extractor.extract_features(user_id)
        
        if not features:
            return None
        
        # Get risk score from ML model
        risk_result = ml_model.calculate_risk_score(features)
        
        # Store in database
        risk_score = RiskScore(
            user_id=user_id,
            score=risk_result['risk_score'],
            risk_level=risk_result['risk_level'],
            anomaly_score=risk_result['anomaly_score'],
            timestamp=datetime.utcnow()
        )
        self.db.add(risk_score)
        self.db.commit()
        
        # Generate alert if high risk
        if risk_result['risk_level'] in ['High', 'Critical']:
            self._generate_alert(user_id, risk_result, features)
        
        return risk_result
    
    def _generate_alert(self, user_id: int, risk_result: dict, features: dict):
        """Generate alert for suspicious behavior"""
        user = self.db.query(User).filter(User.id == user_id).first()
        
        # Build description
        reasons = []
        if features.get('late_night_logins', 0) > 5:
            reasons.append(f"unusual late-night activity ({features['late_night_logins']} times)")
        if features.get('usb_connections', 0) > 3:
            reasons.append(f"excessive USB usage ({features['usb_connections']} connections)")
        if features.get('data_transferred_gb', 0) > 10:
            reasons.append(f"large data transfer ({features['data_transferred_gb']:.1f} GB)")
        if features.get('total_file_accesses', 0) > 200:
            reasons.append(f"unusual file access ({features['total_file_accesses']} files)")
        
        description = f"User {user.username if user else user_id} - " + \
                     (", ".join(reasons) if reasons else "anomalous behavior detected")
        
        # Check for existing unresolved alert
        existing = self.db.query(Alert).filter(
            Alert.user_id == user_id,
            Alert.status == 'new'
        ).first()
        
        if not existing:
            alert = Alert(
                user_id=user_id,
                alert_type='suspicious_behavior',
                severity=risk_result['risk_level'],
                description=description,
                status='new',
                timestamp=datetime.utcnow()
            )
            self.db.add(alert)
            self.db.commit()
            print(f"🚨 ALERT: {risk_result['risk_level']} risk for user {user_id} - {description[:50]}")
    
    def get_user_risk_history(self, user_id: int, days: int = 30):
        """Get risk history for a user"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        scores = self.db.query(RiskScore).filter(
            RiskScore.user_id == user_id,
            RiskScore.timestamp > cutoff
        ).order_by(RiskScore.timestamp).all()
        
        return [{'score': s.score, 'level': s.risk_level, 'timestamp': s.timestamp} 
                for s in scores]
