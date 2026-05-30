import joblib
import numpy as np
import pandas as pd
import os

class MLModel:
    def __init__(self, model_path="app/ml/model.pkl", scaler_path="app/ml/scaler.pkl"):
        self.model = None
        self.scaler = None
        self.feature_columns = [
            'total_logins', 'late_night_logins', 'late_night_ratio',
            'total_file_accesses', 'unique_files_accessed',
            'usb_connections', 'data_transferred_gb', 'avg_files_per_login'
        ]
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
            print("✅ ML Model loaded successfully")
        else:
            print("⚠️ No model found, using default")
            
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
            print("✅ Scaler loaded successfully")
    
    def predict(self, features_dict):
        """Predict anomaly for user features"""
        if not self.model:
            return {'is_anomaly': False, 'anomaly_score': 0.0}
        
        # Create feature vector
        features = [features_dict.get(col, 0) for col in self.feature_columns]
        features_array = np.array([features])
        
        # Predict
        prediction = self.model.predict(features_array)
        score = self.model.decision_function(features_array)[0]
        
        return {
            'is_anomaly': prediction[0] == -1,
            'anomaly_score': float(score)
        }
    
    def calculate_risk_score(self, features_dict, behavior_score=None):
        """Calculate final risk score"""
        ml_result = self.predict(features_dict)
        
        # Convert anomaly score to risk (0-100)
        anomaly_score_normalized = (1 - (ml_result['anomaly_score'] + 1) / 2) * 100
        
        # If behavior score provided, combine
        if behavior_score:
            final_risk = anomaly_score_normalized * 0.6 + behavior_score * 0.4
        else:
            final_risk = anomaly_score_normalized
        
        # Determine risk level
        if final_risk >= 80:
            risk_level = 'Critical'
        elif final_risk >= 60:
            risk_level = 'High'
        elif final_risk >= 30:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        return {
            'risk_score': round(final_risk, 2),
            'risk_level': risk_level,
            'anomaly_score': ml_result['anomaly_score'],
            'is_anomaly': ml_result['is_anomaly']
        }

ml_model = MLModel()
